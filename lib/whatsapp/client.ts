import { z } from "zod";

const GRAPH_API_VERSION = "v19.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class WhatsAppClient {
    private static instance: WhatsAppClient;
    private phoneNumberId: string;
    private accessToken: string;

    private constructor() {
        const phoneId = process.env.WA_PHONE_NUMBER_ID;
        const token = process.env.WA_ACCESS_TOKEN;

        if (!phoneId || !token) {
            console.warn("WhatsApp environment variables missing. Notifications will fail.");
        }

        this.phoneNumberId = phoneId || "";
        this.accessToken = token || "";
    }

    public static getInstance(): WhatsAppClient {
        if (!WhatsAppClient.instance) {
            WhatsAppClient.instance = new WhatsAppClient();
        }
        return WhatsAppClient.instance;
    }

    /**
     * Sends an access alert to a resident using a specific template.
     */
    public async sendAccessAlert(
        to: string,
        visitorName: string,
        unitLabel: string,
        photoUrl: string,
        logId: string
    ) {
        if (!this.phoneNumberId || !this.accessToken) {
            console.error("Cannot send Message: Missing credentials");
            return false;
        }

        // 🚨 TEMPLATE DE PRODUCCIÓN (Pendiente de Aprobación por Meta)
        /*
        const payload = {
            messaging_product: "whatsapp",
            to: to,
            type: "template",
            template: {
                name: "access_alert_v2",
                language: { code: "es_AR" },
                components: [
                    {
                        type: "header",
                        parameters: [
                            {
                                type: "image",
                                image: { link: photoUrl }
                            }
                        ]
                    },
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: visitorName },
                            { type: "text", text: unitLabel }
                        ]
                    },
                    {
                        type: "button",
                        sub_type: "quick_reply",
                        index: "0",
                        parameters: [
                            {
                                type: "payload",
                                payload: `OPEN:${logId}`
                            }
                        ]
                    }
                ]
            }
        };
        */

        // 🧪 TEMPLATE DE PRUEBA (Para verificar conexión mientras aprueban el otro)
        // Nota: Los parámetros (visitorName, unitLabel, etc.) no se usan aquí.
        const payload = {
            messaging_product: "whatsapp",
            to: to,
            type: "template",
            template: {
                name: "hello_world",
                language: { code: "en_US" }
            }
        };

        try {
            const response = await fetch(`${BASE_URL}/${this.phoneNumberId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("WhatsApp API Error:", JSON.stringify(error, null, 2));
                return false;
            }

            return true;
        } catch (error) {
            console.error("WhatsApp Network Error:", error);
            return false;
        }
    }
}
