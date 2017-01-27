import Vue = require('vue')
import 'reflect-metadata'
import { addDecorator } from './decorators'

export type PropertyDecorator = (target: any, key: string) => void
export function prop(type: Constructor | Constructor[]): PropertyDecorator
export function prop(target: any, key: string): void
export function prop(target: any, key?: string): PropertyDecorator | void {
	function makeDecorator(type?: Constructor | Constructor[]): PropertyDecorator {
		return (target, key) => {
			addDecorator(target, key, (options, component) => {
				let property: Vue.PropOptions = {}

				if (typeof component[key] === 'object') {
					property.default = () => component[key]
				} else if (component[key]) {
					property.default = component[key]
				} else {
					property.required = true
				}

				if (type !== undefined) {
					property.type = type
				} else if (component[key]) {
					try {
						property.type = Object.getPrototypeOf(component[key]).constructor
					} catch (error) {
						property.type = component[key].__proto__ ? component[key].__proto__.constructor : component[key].constructor
					}
				} else {
					property.type = Reflect.getMetadata('design:type', target, key)
				}

				(options.props || (options.props = {}) as any)[key] = property

				return true
			})
		}
	}

	if (typeof key === 'string') {
		return makeDecorator()(target, key)
	} else {
		return makeDecorator(target)
	}
}

export const Prop = prop
