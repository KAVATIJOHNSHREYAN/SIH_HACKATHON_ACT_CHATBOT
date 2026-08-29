import emailjs from "@emailjs/browser";

export interface EmailParams {
  from_name: string;
  reply_to: string;
  message: string;
}

/**
 * Log errors strictly in development mode to keep production console clean
 */
const logError = (error: any) => {
  if (process.env.NODE_ENV === "development") {
    console.error("EmailJS Service Error Details:", error);
  }
};

/**
 * Reusable EmailJS browser service to dispatch contact messages
 * Uses async/await and wraps delivery inside try/catch blocks
 */
export const sendContactEmail = async (
  params: EmailParams,
  serviceId: string,
  templateId: string,
  publicKey: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        from_name: params.from_name,
        reply_to: params.reply_to,
        message: params.message
      },
      publicKey
    );

    if (response.status === 200) {
      return { success: true };
    }
    throw new Error(`EmailJS responded with an unexpected status: ${response.status}`);
  } catch (err: any) {
    logError(err);
    return { 
      success: false, 
      error: err.text || err.message || "Failed to establish mail server connection." 
    };
  }
};
