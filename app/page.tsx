import type { Metadata } from "next";
import { ExportChatbot } from "@/components/export-chatbot";

export const metadata: Metadata = {
  title: "Expora - AI Export Compliance Assistant",
  description:
    "Analyze product images for export compliance to different countries",
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50/50 p-2 md:p-6 lg:p-24">
      <div className="w-full max-w-3xl mx-auto">
        <img
          src="/expora-logo.jpg"
          alt="Expora Logo"
          className="w-32 h-32 mx-auto "
        />
        <h1 className="text-xl md:text-3xl font-bold text-center mb-2 md:mb-6">
          Expora Chatbot
        </h1>

        <p className="text-sm md:text-base text-muted-foreground text-center mb-4 md:mb-8">
          AI-powered export compliance analysis for your products
        </p>
        <ExportChatbot />
      </div>
    </main>
  );
}
