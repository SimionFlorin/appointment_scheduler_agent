import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "./prisma";
import {
  getAvailableSlots,
  createCalendarEvent,
  deleteCalendarEvent,
} from "./google-calendar";
import { getWhatsAppProvider } from "./whatsapp";
import { ConversationMessage } from "@/types";

function getModel(provider: string) {
  switch (provider) {
    case "OPENAI":
      return new ChatOpenAI({
        model: "gpt-4.1-nano",
        apiKey: process.env.OPENAI_API_KEY,
      });
    case "GEMINI":
    default:
      return new ChatGoogleGenerativeAI({
        model: "gemini-3.1-flash-lite-preview",
        apiKey: process.env.GEMINI_API_KEY,
      });
  }
}

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

function createTools(
  userId: string,
  timezone: string,
  options?: { simulate?: boolean }
) {
  const getServicesTool = tool(
    async () => {
      const services = await prisma.service.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          duration: true,
        },
      });
      return JSON.stringify(services);
    },
    {
      name: "get_services",
      description:
        "Get the list of services offered by this business with their prices and durations",
      schema: z.object({}),
    }
  );

  const getAvailabilityTool = tool(
    async ({ date, service_id }) => {
      const service = await prisma.service.findUnique({
        where: { id: service_id },
        select: { duration: true },
      });
      if (!service) return JSON.stringify({ error: "Service not found" });

      const slots = await getAvailableSlots(
        userId,
        date,
        service.duration,
        timezone
      );
      return JSON.stringify(slots.slice(0, 8));
    },
    {
      name: "get_availability",
      description:
        "Check available appointment slots for a given date and service. Returns a list of available time slots.",
      schema: z.object({
        date: z.string().describe("The date to check in YYYY-MM-DD format"),
        service_id: z
          .string()
          .describe("The ID of the service to check availability for"),
      }),
    }
  );

  const bookAppointmentTool = tool(
    async ({ service_id, customer_name, customer_phone, datetime }) => {
      const service = await prisma.service.findUnique({
        where: { id: service_id },
      });
      if (!service) return JSON.stringify({ error: "Service not found" });

      const isTest = !!options?.simulate;
      const startTime = new Date(datetime);
      const endTime = new Date(startTime.getTime() + service.duration * 60000);
      const summary = isTest
        ? `(Test Appointment) ${service.name} - ${customer_name}`
        : `${service.name} - ${customer_name}`;

      const calendarEvent = await createCalendarEvent(userId, {
        summary,
        description: `Service: ${service.name}\nCustomer: ${customer_name}\nPhone: ${customer_phone}\nPrice: $${service.price}${isTest ? "\n\n⚠ This is a test appointment created via the Chat Simulator." : ""}`,
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
          isTest,
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
    },
    {
      name: "book_appointment",
      description:
        "Book an appointment for a customer. Creates an event in Google Calendar.",
      schema: z.object({
        service_id: z.string().describe("The ID of the service to book"),
        customer_name: z.string().describe("The customer's name"),
        customer_phone: z.string().describe("The customer's phone number"),
        datetime: z
          .string()
          .describe(
            "The appointment start time in ISO 8601 format (e.g. 2025-03-15T14:00:00)"
          ),
      }),
    }
  );

  const cancelAppointmentTool = tool(
    async ({ appointment_id }) => {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointment_id },
      });
      if (!appointment)
        return JSON.stringify({ error: "Appointment not found" });

      if (appointment.googleCalendarEventId) {
        try {
          await deleteCalendarEvent(
            userId,
            appointment.googleCalendarEventId
          );
        } catch {
          // Calendar event may already be deleted
        }
      }

      await prisma.appointment.update({
        where: { id: appointment_id },
        data: { status: "CANCELLED" },
      });

      return JSON.stringify({
        success: true,
        message: "Appointment cancelled",
      });
    },
    {
      name: "cancel_appointment",
      description: "Cancel an existing appointment by its ID",
      schema: z.object({
        appointment_id: z
          .string()
          .describe("The appointment ID to cancel"),
      }),
    }
  );

  const getBusinessHoursTool = tool(
    async () => {
      const profile = await prisma.businessProfile.findUnique({
        where: { userId },
      });
      if (!profile)
        return JSON.stringify({ error: "Business profile not found" });

      const days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ] as const;
      const hours: Record<
        string,
        { open: string | null; close: string | null }
      > = {};
      for (const day of days) {
        hours[day] = {
          open:
            (profile[`${day}Start` as keyof typeof profile] as string) || null,
          close:
            (profile[`${day}End` as keyof typeof profile] as string) || null,
        };
      }
      return JSON.stringify(hours);
    },
    {
      name: "get_business_hours",
      description: "Get the business hours for each day of the week",
      schema: z.object({}),
    }
  );

  return [
    getServicesTool,
    getAvailabilityTool,
    bookAppointmentTool,
    cancelAppointmentTool,
    getBusinessHoursTool,
  ];
}

export async function processWhatsAppMessage(
  userId: string,
  customerPhone: string,
  messageBody: string,
  options?: { simulate?: boolean }
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businessProfile: true,
      whatsappConfig: true,
    },
  });

  if (!user || !user.businessProfile) {
    throw new Error("User not configured properly");
  }

  if (!options?.simulate && !user.whatsappConfig) {
    throw new Error("WhatsApp not configured");
  }

  const timezone = user.businessProfile.timezone;

  let conversation = await prisma.conversation.findUnique({
    where: {
      userId_customerPhone: { userId, customerPhone },
    },
  });

  const existingMessages: ConversationMessage[] = conversation
    ? (conversation.messages as unknown as ConversationMessage[])
    : [];

  existingMessages.push({
    role: "customer",
    content: messageBody,
    timestamp: new Date().toISOString(),
  });

  const recentMessages = existingMessages.slice(-20);

  // Build LangChain message history
  const chatHistory: BaseMessage[] = recentMessages.slice(0, -1).map((msg) =>
    msg.role === "customer"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content)
  );

  const tools = createTools(userId, timezone, options);
  const model = getModel(user.llmProvider).bindTools(tools);

  const messages: BaseMessage[] = [
    new SystemMessage(
      buildSystemPrompt(
        user.businessProfile.businessName,
        user.profession || "Service Provider",
        timezone
      )
    ),
    ...chatHistory,
    new HumanMessage(messageBody),
  ];

  let response = await model.invoke(messages);

  while (response.tool_calls && response.tool_calls.length > 0) {
    messages.push(response);

    for (const toolCall of response.tool_calls) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchedTool = tools.find((t) => t.name === toolCall.name) as any;
      if (matchedTool) {
        const result = await matchedTool.invoke(toolCall.args);
        messages.push(
          new ToolMessage({
            content: typeof result === "string" ? result : JSON.stringify(result),
            tool_call_id: toolCall.id!,
            name: toolCall.name,
          })
        );
      } else {
        messages.push(
          new ToolMessage({
            content: JSON.stringify({
              error: `Unknown function: ${toolCall.name}`,
            }),
            tool_call_id: toolCall.id!,
            name: toolCall.name,
          })
        );
      }
    }

    response = await model.invoke(messages);
  }

  const assistantMessage =
    typeof response.content === "string" && response.content
      ? response.content
      : "I'm sorry, I couldn't process that. Could you try again?";

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
        isTest: !!options?.simulate,
      },
    });
  }

  if (!options?.simulate && user.whatsappConfig) {
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
  }

  return assistantMessage;
}
