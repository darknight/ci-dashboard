import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearCache } from '$lib/github';

export const POST: RequestHandler = async () => {
	clearCache();
	return json({ success: true });
};
