"use client";

import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RiRobot2Fill } from "react-icons/ri";

const faqs = [
  {
    question: "How does CropConnect ensure fair trade opportunities?",
    answer: "CropConnect eliminates intermediary markets by enabling direct connections between agribusinesses and buyers. This ensures transparent pricing, reduces margin exploitation, and creates fair trade opportunities for all parties involved."
  },
  {
    question: "What features are available for agribusinesses?",
    answer: "Agribusinesses can create and manage crop listings with detailed information about category, images, location, availability, and pricing. You can also generate quotations, track orders in real-time, and access valuable market analytics and insights."
  },
  {
    question: "How does the logistics integration work?",
    answer: "We integrate with trusted third-party logistics providers like FedEx and DHL. You can select preferred shipping options, get transparent cost estimates based on distance and weight, and track shipments in real-time through our platform."
  },
  {
    question: "What verification process do sellers undergo?",
    answer: "All agribusinesses undergo a comprehensive Know Your Business (KYB) verification process. This includes submitting business registration documents and receiving approval from our admin team to ensure a trusted marketplace."
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept multiple secure payment methods, including credit card and bank transfers, to ensure smooth and safe transactions between buyers and sellers."
  },
  {
    question: "Is there any support available if I encounter issues?",
    answer: "Yes, we provide 24/7 customer support through multiple channels including live chat, email, and phone. Our dedicated support team is ready to assist you with any technical issues, transaction queries, or general platform guidance."
  }
];

export default function FAQ() {
  return (
    <section className="bg-yellow-800">
      <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 pt-10 pb-10">
        <div className="relative p-8 sm:p-16 lg:p-24 flex items-center justify-center">
          <div className="relative h-[600px] flex items-center">
            <div className="rounded-3xl overflow-hidden shadow-lg">
              <Image
                src="/FAQs.png"
                alt="Farmer in a cornfield at sunset"
                width={600}
                height={600}
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-8 right-4 w-auto bg-yellow-400 text-green-900 rounded-2xl px-6 py-4 flex items-center space-x-4 shadow-xl cursor-pointer hover:bg-yellow-300 transition-colors duration-300">
              <div className="bg-green-900 p-3 rounded-full">
                <RiRobot2Fill className="text-2xl text-white" />
              </div>
              <div>
                <p className="font-bold text-lg whitespace-nowrap">Chat with Us</p>
                <p className="text-sm font-medium">Get instant support</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#FDF7E8] p-8 sm:p-12 lg:p-16 rounded-tl-3xl rounded-bl-3xl overflow-y-auto max-h-[800px]"> 
          <div className="inline-flex items-center px-4 py-3 bg-transparent border border-green-800 rounded-full mb-10">
            <span className="text-md font-medium tracking-wide text-green-900">
              Frequently Asked Questions
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-green-900 mb-10">
            How Can We Help You?
          </h1>

          <Accordion type="single" collapsible className="divide-y divide-green-700">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="px-6 py-2 bg-transparent data-[state=open]:bg-green-50 transition-colors duration-300 hover:shadow-md"
              >
                <AccordionTrigger className="text-lg font-medium text-green-900 hover:no-underline cursor-pointer">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-green-800 tracking-wide">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
