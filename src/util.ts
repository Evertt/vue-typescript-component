/// <reference path="./globals.d.ts" />

export function objAssign<T, U, V>(target: T, source1: U, source2?: V): T & U & V {
	if (source1) {
		for (let n of Object.getOwnPropertyNames(source1)) {
			Object.defineProperty(target, n, Object.getOwnPropertyDescriptor(source1, n))
		}
	}
	if (source2) {
		for (let n of Object.getOwnPropertyNames(source2)) {
			Object.defineProperty(target, n, Object.getOwnPropertyDescriptor(source2, n))
		}
	}
	return <T & U & V>target
}

export function warn (message: string): void {
	if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
		console.warn('[vue-typescript-component] ' + message)
	}
}
