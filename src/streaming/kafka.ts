import { Kafka, Producer, CompressionTypes } from "kafkajs";
import config from "../config/config";

let kafka: Kafka | null = null;
let producer: Producer | null = null;
let isConnected = false;

export async function initKafka(): Promise<void> {
  if (!config.streaming.kafka.enabled) return;
  
  kafka = new Kafka({
    clientId: config.streaming.kafka.clientId,
    brokers: config.streaming.kafka.brokers,
    retry: {
      initialRetryTime: 100,
      retries: 8
    }
  });
  
  producer = kafka.producer({
    compression: CompressionTypes.GZIP,
    maxInFlightRequests: 5,
    idempotent: true
  });
  
  try {
    await producer.connect();
    isConnected = true;
    console.log(`Kafka producer connected to ${config.streaming.kafka.brokers.join(", ")}`);
  } catch (error) {
    console.error("ERROR: Failed to connect to Kafka:", error);
    console.error("       Make sure Kafka is running on", config.streaming.kafka.brokers);
    isConnected = false;
  }
}

export async function sendToKafka(logType: string, logData: any): Promise<void> {
  if (!producer || !isConnected) return;
  
  try {
    await producer.send({
      topic: config.streaming.kafka.topic,
      messages: [
        {
          key: logType,
          value: JSON.stringify({
            log_type: logType,
            timestamp: new Date().toISOString(),
            data: logData
          }),
          timestamp: Date.now().toString()
        }
      ]
    });
  } catch (error) {
    console.error("Failed to send to Kafka:", error);
  }
}

export async function closeKafka(): Promise<void> {
  if (producer) {
    try {
      await producer.disconnect();
      isConnected = false;
      console.log("Kafka producer disconnected");
    } catch (error) {
      console.error("Failed to disconnect Kafka:", error);
    }
  }
}

export function isKafkaConnected(): boolean {
  return isConnected;
}

