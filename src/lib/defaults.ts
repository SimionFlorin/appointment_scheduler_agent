import { Profession } from "@prisma/client";

interface DefaultService {
  name: string;
  description: string;
  price: number;
  duration: number;
}

const DENTIST_SERVICES: DefaultService[] = [
  {
    name: "Routine Cleaning",
    description: "Professional teeth cleaning and polishing",
    price: 120,
    duration: 45,
  },
  {
    name: "Dental Exam",
    description: "Comprehensive oral examination",
    price: 80,
    duration: 30,
  },
  {
    name: "Teeth Whitening",
    description: "Professional teeth whitening treatment",
    price: 350,
    duration: 60,
  },
  {
    name: "Filling",
    description: "Tooth filling for cavities",
    price: 200,
    duration: 45,
  },
  {
    name: "Root Canal",
    description: "Root canal treatment",
    price: 900,
    duration: 90,
  },
  {
    name: "Crown",
    description: "Dental crown placement",
    price: 1200,
    duration: 60,
  },
];

const MECHANIC_SERVICES: DefaultService[] = [
  {
    name: "Oil Change",
    description: "Standard oil and filter change",
    price: 45,
    duration: 30,
  },
  {
    name: "Brake Inspection",
    description: "Complete brake system inspection",
    price: 50,
    duration: 30,
  },
  {
    name: "Brake Pad Replacement",
    description: "Front or rear brake pad replacement",
    price: 250,
    duration: 60,
  },
  {
    name: "Tire Rotation",
    description: "Rotate and balance all four tires",
    price: 40,
    duration: 30,
  },
  {
    name: "Engine Diagnostic",
    description: "Full engine diagnostic scan and analysis",
    price: 100,
    duration: 45,
  },
  {
    name: "Full Service",
    description: "Comprehensive vehicle service and inspection",
    price: 300,
    duration: 120,
  },
];

export function getDefaultServices(profession: Profession): DefaultService[] {
  switch (profession) {
    case "DENTIST":
      return DENTIST_SERVICES;
    case "MECHANIC":
      return MECHANIC_SERVICES;
    default:
      return [];
  }
}
