import { ComponentOptions } from './component'

export type Decorator = {
    target: any,
    fn: (options: ComponentOptions, obj: any) => void | boolean
}

export let decorators: { [key: string]: Decorator[] } = {}

export function addDecorator(target: any, key: string, fn: (options: ComponentOptions, obj: any) => void | boolean) {
	let list = decorators[key] || []
	list.push({
        target: target,
        fn: fn
    })
	decorators[key] = list
}
