// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				GITHUB_TOKEN: string;
				GITHUB_OWNER: string;
				GITHUB_REPOS: string;
			};
		}
	}
}

export {};
