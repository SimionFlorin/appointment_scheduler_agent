import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclaration,
} from "@google/generative-ai";
import { prisma } from "./prisma";
import { getAvailableSlots, createCalendarEvent, deleteCalendarEvent } from "./google-calendar";
import { getWhatsAppProvider } from "./whatsapp";
import { ConversationMessage } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const schedulingFunctions: FunctionDeclaration[] = [
  {
    name: "get_services",
    description:
      "Get the list of services offered by this business with their prices and durations",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_availability",
    description:
      "Check available appointment slots for a given date and service. Returns a list of available time slots.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        date: {
          type: SchemaType.STRING,
          description: "The date to check in YYYY-MM-DD format",
        },
        service_id: {
          type: SchemaType.STRING,
          description: "The ID of the service to check availability for",
        },
      },
      required: ["date", "service_id"],
    },
  },
  {
    name: "book_appointment",
    description:
      "Book an appointment for a customer. Creates an event in Google Calendar.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        service_id: {
          type: SchemaType.STRING,
          description: "The ID of the service to book",
        },
        customer_name: {
          type: SchemaType.STRING,
          description: "The customer's name",
        },
        customer_phone: {
          type: SchemaType.STRING,
          description: "The customer's phone number",
        },
        datetime: {
          type: SchemaType.STRING,
          description:
            "The appointment start time in ISO 8601 format (e.g. 2025-03-15T14:00:00)",
        },
      },
      required: ["service_id", "customer_name", "customer_phone", "datetime"],
    },
  },
  {
    name: "cancel_appointment",
    description: "Cancel an existing appointment by its ID",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        appointment_id: {
          type: SchemaType.STRING,
          description: "The appointment ID to cancel",
        },
      },
      required: ["appointment_id"],
    },
  },
  {
    name: "get_business_hours",
    description: "Get the business hours for each day of the week",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
];

function buildSystemPrompt(
  businessName: string,
  profession: string,
  timezone: string
): string {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });

  return `You are an AI scheduling assistant for "${businessName}", a ${profession.toLowerCase()} practice.

Today is ${today}. The timezone is ${timezone}.

Your job is to help customers book, reschedule, or cancel appointments via WhatsApp.

Guidelines:
- Be professional, friendly, and concise — this is WhatsApp, keep messages short.
- When a customer wants to book, first show them available services using get_services.
- Once they pick a service, ask for their preferred date. If they say something like "tomorrow" or "next Monday", resolve it to a specific date.
- Use get_availability to check open slots for their chosen date and service.
- Present available times in a readable format (e.g. "2:00 PM", not ISO timestamps).
- When they pick a time, ask for their name if you don't have it yet, then book using book_appointment.
- For cancellations, ask for details to identify the appointment, then use cancel_appointment.
- If no slots are available, suggest the next available day.
- Never make up availability — always check with get_availability first.
- If the customer's message is unclear, politely ask for clarification.
- Keep the conversation flowing naturally. Don't repeat information they already gave.
- Format prices as currency (e.g. $120, not 120).
- Format durations in human-readable form (e.g. "45 minutes", not "45 min").`;
}

async function executeFunctionCall(
  functionName: string,
  args: Record<string, string>,
  userId: string,
  timezone: string
): Promise<string> {
  switch (functionName) {
    case "get_services": {
      const services = await prisma.service.findMany({
        where: { userId, isActive: true },
        select: { id: true, name: true, description: true, price: true, duration: true },
      });
      return JSON.stringify(services);
    }

    case "get_availability": {
      const { date, service_id } = args;
      const service = await prisma.service.findUnique({
        where: { id: service_id },
        select: { duration: true },
      });
      if (!service) return JSON.stringify({ error: "Service not found" });

      const slots = await getAvailableSlots(userId, date, service.duration, timezone);
      return JSON.stringify(slots.slice(0, 8)); // Limit to 8 slots for readability
    }

    case "book_appointment": {
      const { service_id, customer_name, customer_phone, datetime } = args;
      const service = await prisma.service.findUnique({
        where: { id: service_id },
      });
      if (!service) return JSON.stringify({ error: "Service not found" });

      const startTime = new Date(datetime);
      const endTime = new Date(startTime.getTime() + service.duration * 60000);

      const calendarEvent = await createCalendarEvent(userId, {
        summary: `${service.name} - ${customer_name}`,
        description: `Service: ${service.name}\nCustomer: ${customer_name}\nPhone: ${customer_phone}\nPrice: $${service.price}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        attendeePhone: customer_phone,
        timezone,
      });

      const appointment = await prisma.appointment.create({
        data: {
          userId,
          serviceId: service_id,
          customerName: customer_name,
          customerPhone: customer_phone,
          startTime,
          endTime,
          googleCalendarEventId: calendarEvent.id || undefined,
        },
      });

      return JSON.stringify({
        success: true,
        appointmentId: appointment.id,
        service: service.name,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        price: service.price,
      });
    }

    case "cancel_appointment": {
      const { appointment_id } = args;
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointment_id },
      });
      if (!appointment) return JSON.stringify({ error: "Appointment not found" });

      if (appointment.googleCalendarEventId) {
        try {
          await deleteCalendarEvent(userId, appointment.googleCalendarEventId);
        } catch {
          // Calendar event may already be deleted
        }
      }

      await prisma.appointment.update({
        where: { id: appointment_id },
        data: { status: "CANCELLED" },
      });

      return JSON.stringify({ success: true, message: "Appointment cancelled" });
    }

    case "get_business_hours": {
      const profile = await prisma.businessProfile.findUnique({
        where: { userId },
      });
      if (!profile) return JSON.stringify({ error: "Business profile not found" });

      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
      const hours: Record<string, { open: string | null; close: string | null }> = {};
      for (const day of days) {
        hours[day] = {
          open: (profile[`${day}Start` as keyof typeof profile] as string) || null,
          close: (profile[`${day}End` as keyof typeof profile] as string) || null,
        };
      }
      return JSON.stringify(hours);
    }

    default:
      return JSON.stringify({ error: `Unknown function: ${functionName}` });
  }
}

export async function processWhatsAppMessage(
  userId: string,
  customerPhone: string,
  messageBody: string
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businessProfile: true,
      whatsappConfig: true,
    },
  });

  if (!user || !user.businessProfile || !user.whatsappConfig) {
    throw new Error("User not configured properly");
  }

  const timezone = user.businessProfile.timezone;

  // Load or create conversation
  let conversation = await prisma.conversation.findUnique({
    where: {
      userId_customerPhone: { userId, customerPhone },
    },
  });

  const existingMessages: ConversationMessage[] = conversation
    ? (conversation.messages as unknown as ConversationMessage[])
    : [];

  // Add the new customer message
  existingMessages.push({
    role: "customer",
    content: messageBody,
    timestamp: new Date().toISOString(),
  });

  // Trim to last 20 messages for context window
  const recentMessages = existingMessages.slice(-20);

  // Build conversation history for Gemini
  const chatHistory = recentMessages.slice(0, -1).map((msg) => ({
    role: msg.role === "customer" ? "user" as const : "model" as const,
    parts: [{ text: msg.content }],
  }));

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: buildSystemPrompt(
      user.businessProfile.businessName,
      user.profession || "Service Provider",
      timezone
    ),
    tools: [{ functionDeclarations: schedulingFunctions }],
  });

  const chat = model.startChat({ history: chatHistory });

  let result = await chat.sendMessage(messageBody);
  let response = result.response;

  // Handle function calls in a loop (Gemini may chain multiple calls)
  while (response.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
    const functionCall = response.candidates[0].content.parts[0].functionCall;
    const functionName = functionCall.name;
    const functionArgs = (functionCall.args as Record<string, string>) || {};

    const functionResult = await executeFunctionCall(
      functionName,
      functionArgs,
      userId,
      timezone
    );

    result = await chat.sendMessage([
      {
        functionResponse: {
          name: functionName,
          response: { result: functionResult },
        },
      },
    ]);
    response = result.response;
  }

  const assistantMessage =
    response.candidates?.[0]?.content?.parts?.[0]?.text ||
    "I'm sorry, I couldn't process that. Could you try again?";

  // Save to conversation
  recentMessages.push({
    role: "assistant",
    content: assistantMessage,
    timestamp: new Date().toISOString(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messagesJson = JSON.parse(JSON.stringify(recentMessages)) as any;

  if (conversation) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messages: messagesJson,
        lastMessageAt: new Date(),
        customerName: conversation.customerName || undefined,
      },
    });
  } else {
    await prisma.conversation.create({
      data: {
        userId,
        customerPhone,
        messages: messagesJson,
        lastMessageAt: new Date(),
      },
    });
  }

  // Send reply via WhatsApp
  const whatsapp = getWhatsAppProvider(user.whatsappConfig.provider, {
    phoneNumberId: user.whatsappConfig.phoneNumberId || "",
    metaAccessToken: user.whatsappConfig.metaAccessToken || "",
    twilioAccountSid: user.whatsappConfig.twilioAccountSid || "",
    twilioAuthToken: user.whatsappConfig.twilioAuthToken || "",
    twilioPhoneNumber: user.whatsappConfig.twilioPhoneNumber || "",
  });

  await whatsapp.sendMessage({
    to: customerPhone,
    body: assistantMessage,
  });

  return assistantMessage;
}
