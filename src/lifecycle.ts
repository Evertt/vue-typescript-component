import { warn } from './util'
import { addDecorator } from './decorators'

const lifeCycleHooks = [
		'beforeCreate', 'created',
		'beforeMount', 'mounted',
		'activated', 'deactivated',
		'beforeUpdate', 'updated',
		'beforeDestroy', 'destroyed',
		'render', /* not a lifecyle hook, but handled identically */
]

export function lifecycle(target: any, key: string): void {
	if (lifeCycleHooks.indexOf(key) === -1) {
		return warn(
			'The @lifecycle decorator only ' +
			'applies to valid lifecycle hooks ' +
			'and the render method.',
		)
	}

	addDecorator(key, options => {
		(options as any)[key] = Object.getOwnPropertyDescriptor(target, key).value

		return true
	})
}

export const Lifecycle = lifecycle
