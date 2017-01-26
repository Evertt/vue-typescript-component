import Vue = require('vue')
import { objAssign, warn } from './util'
import { addDecorator } from './decorators'

export function watch(property: string, watchOptions: Vue.WatchOptions = {}) {
	return (target: any, key: string) => {
		addDecorator(key, options => {
			let watch: any = (options.watch || (options.watch = {}))

			if (watch[property] && watch[property].handler !== key) {
				warn(`
					You have defined several watchers (${key} and ${watch[property].handler})
					for the same property ${property}. All but the last one will be overridden.
				`)
			}

			watch[property] = { handler: key }

			objAssign(watch[property], { handler: key }, watchOptions)
		})
	}
}

export const Watch = watch
