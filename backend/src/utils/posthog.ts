import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

export const getPostHogClient = () => {
    if (!posthogClient && process.env.POSTHOG_KEY) {
        posthogClient = new PostHog(process.env.POSTHOG_KEY, {
            host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
        });
    }
    return posthogClient;
};
