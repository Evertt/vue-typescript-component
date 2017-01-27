import { addDecorator } from './decorators'

export function injected(target: any, key: string): void {
    addDecorator(target, key, () => true)
}

export const Injected = injected
