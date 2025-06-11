import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/stonfi/ui/button";
import { Card, CardContent } from "@/components/stonfi/ui/card";

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a very short loading time since content is static
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-white w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-white scrollbar-hidden">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-semibold">Privacy Policy</h1>
        </div>

        <Card>
          <CardContent className="p-6 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-gray-300 leading-relaxed">
                Welcome to MRB's Privacy Policy. This document explains how we collect, use, and protect your personal information when you use our services. We are committed to ensuring that your privacy is protected and that we comply with all applicable data protection laws.
              </p>
            </section>
             
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 