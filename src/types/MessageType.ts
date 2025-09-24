import { z } from 'zod';

export const LocationSchema = z.object({
    lat: z.number(),
    lng: z.number(),
});

export const MediaSchema = z.object({
    mimetype: z.string(),
    fileName: z.string().optional(),
    data: z.string(), // Para datos base64 o URL de storage
});

export const MessageSchema = z.object({
    type: z.enum([
        'chat',
        'image',
        'video',
        'audio',
        'document',
        'sticker',
        'location'
    ]).default('chat'),
    body: z.string().optional(),
    caption: z.string().optional(),
    quotedMessageId: z.string().optional(),
    mentions: z.array(z.string()).default([]),
    location: LocationSchema.optional(),
    media: MediaSchema.optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export type MessageType = z.infer<typeof MessageSchema>;