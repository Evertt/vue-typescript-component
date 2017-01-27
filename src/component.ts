import Vue = require('vue')
import { VueClass } from './vue-class'
import { objAssign } from './util'
import { decorators } from './decorators'

export type ComponentOptions = Vue.ComponentOptions<Vue>

Array.prototype.mapToObject =
	function(transform: (obj: any) => any): any {
		let transformed: any = {}
		for (let elem of this) {
			objAssign(transformed, transform(elem))
		}
		return transformed
	}

export interface NoArgumentConstructable {
	new (): any
	name?: any
	vueComponentOptions?: ComponentOptions
}

function isNoArgumentConstructable(arg: any): arg is NoArgumentConstructable {
	return arg instanceof Function
}

let makeObject = (obj: any) => (key: string) => ({ [key]: obj[key] })
let getMethod  = (obj: any) => (key: string) => Object.getOwnPropertyDescriptor(obj, key).value

function makeComponentDecorator(options: ComponentOptions = {}): ComponentDecorator {
	return (Component: NoArgumentConstructable) => {
		const component = new Component()
		const prototype = Component.prototype

		const superProto = Object.getPrototypeOf(prototype)
		const Super = superProto instanceof Vue
			? superProto.constructor as VueClass
			: Vue

		let andDecorate = (obj: any) => (key: string) =>
			key == 'constructor' || ! (decorators[key] || []).reduce(
				(result, decorator) =>
					decorator.target == obj || decorator.target == obj.__proto__
						? decorator.fn(options, obj) || result : result, false,
			)

		let componentKeys = Object.getOwnPropertyNames(component).filter(andDecorate(component))
		let prototypeKeys = Object.getOwnPropertyNames(prototype).filter(andDecorate(prototype))

		let decKeys = Object.keys(decorators)
		let allKeys = componentKeys.concat(prototypeKeys)
		decKeys.filter(key => allKeys.indexOf(key) === -1).filter(andDecorate(component))

		let staticKeys = Object.getOwnPropertyNames(Component)
		let superStaticKeys = Object.getOwnPropertyNames(Super)
		let componentStaticKeys = staticKeys.filter( key => superStaticKeys.indexOf(key) === -1)

		componentKeys = componentKeys.filter(andDecorate(component))
		prototypeKeys = prototypeKeys.filter(andDecorate(prototype))

		getData(componentKeys, options, component)
		getMethods(prototypeKeys, options, prototype)
		getComputed(prototypeKeys, options, prototype)
		getOptions(componentStaticKeys, options, Component)

		const superOptions = Component.vueComponentOptions || {}
		options.name       = options.name || (<any>Component).name
		options.methods    = objAssign( {}, superOptions.methods,  options.methods  )
		options.computed   = objAssign( {}, superOptions.computed, options.computed )
		options.watch      = objAssign( {}, superOptions.watch,    options.watch    )
		options.props      = objAssign( {}, superOptions.props,    options.props    )

		Component.vueComponentOptions = options

		if (process.env.NODE_ENV !== 'test') return Super.extend(options)
	}
}

function getData(keys: string[], options: ComponentOptions, component: any) {
	let dataKeys = keys.filter(key => key[0] !== '_' && key[0] !== '$')
	options.data = () => dataKeys.mapToObject(makeObject(component))
}

function getMethods(keys: string[], options: ComponentOptions, prototype: any) {
	let dataKeys = keys.filter(key => key !== 'constructor')

	let methods = (options.methods || (options.methods = {}))

	for (let key of dataKeys) {
		let method = getMethod(prototype)(key)
		if (method) { methods[key] = method }
	}
}

function getComputed(keys: string[], options: ComponentOptions, prototype: any) {
	let computedKeys = keys.filter(key => Object.getOwnPropertyDescriptor(prototype, key).get)

	options.computed = computedKeys.mapToObject( key => {
		let pd = Object.getOwnPropertyDescriptor(prototype, key)
		return { [key]: { get: pd.get, set: pd.set } }
	})
}

function getOptions(keys: string[], options: ComponentOptions, Component: any) {
	objAssign(options, keys.mapToObject(makeObject(Component)))
}

/** Create property constructor.vueComponentOptions based on method/field annotations
 *  If provided, use options as the base value (.data is always overridden)
 */
export type ComponentDecorator = (cls: NoArgumentConstructable) => void
export function Component(cls: NoArgumentConstructable): void
export function Component(options: ComponentOptions): ComponentDecorator
export function Component(options: ComponentOptions | NoArgumentConstructable): ComponentDecorator | void {
	if (isNoArgumentConstructable(options)) {
		return makeComponentDecorator()(options)
	} else {
		return makeComponentDecorator(options)
	}
}

export const component = Component
