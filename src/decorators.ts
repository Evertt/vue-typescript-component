import { ComponentOptions } from './component'

export type Decorator = (options: ComponentOptions) => void | boolean

export let decorators: { [key: string]: Decorator[] } = {}

export function addDecorator(key: string, decorator: Decorator) {
	let list = decorators[key] || []
	list.push(decorator)
	decorators[key] = list
}
