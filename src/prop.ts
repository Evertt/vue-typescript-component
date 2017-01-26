import Vue = require('vue')
import { addDecorator } from './decorators'

export function prop(target: any, key: string): void {
	addDecorator(key, options => {
		let property: Vue.PropOptions = {}

		if (typeof target[key] === 'object') {
			property.default = () => target[key]
		} else {
			property.default = target[key]
		}

		if (property.type === undefined) {
			try {
				property.type = Object.getPrototypeOf(target[key]).constructor
			} catch (error) {
				// property.type = target[key].__proto__ ? target[key].__proto__.constructor : target[key].constructor
			}
		}

		if (property.default === undefined) {
			property.required = true
		}

		(options.props || (options.props = {}) as any)[key] = property
	})
}

export const Prop = prop
