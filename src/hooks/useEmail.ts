import { useState } from "react";
import { sendContactEmail, EmailParams } from "@/services/emailService";

/**
 * Custom React hook managing submission lifecycle states for EmailJS integration
 */
export const useEmail = (
  serviceId: string,
  templateId: string,
  publicKey: string
) => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Submit email parameters using async/await and update loading, success, and error states
   */
  const sendEmail = async (params: EmailParams): Promise<boolean> => {
    setSending(true);
    setError(null);
    setSuccess(false);

    const result = await sendContactEmail(params, serviceId, templateId, publicKey);

    setSending(false);
    if (result.success) {
      setSuccess(true);
      return true;
    } else {
      setError(result.error || "Failed to send the email inquiry.");
      return false;
    }
  };

  return { 
    sendEmail, 
    sending, 
    error, 
    success, 
    setSuccess, 
    setError 
  };
};
