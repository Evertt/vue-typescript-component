/**
 * global type declarations in this project
 * should not expose to userland
 */

declare const process: {
	env: {
		NODE_ENV: string,
	},
}

declare interface Array<T> {
	mapToObject(transform: (obj: any) => any): any
}
