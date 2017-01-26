import Vue = require('vue')

type ComponentOptions = Vue.ComponentOptions<Vue>

declare global {
    interface Array<T> {
        mapToObject(transform: (any) => any): any
    }
}

// implementation Object.assign (targets only the scope of this project)
function objAssign<T, U, V>(target: T, source1: U, source2?: V): T & U & V {
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

Array.prototype.mapToObject = function(transform: (any) => any): any {
    var transformed: any = {}
    for (var elem of this) {
        objAssign(transformed, transform(elem))
    }
    return transformed
}

type Decorator = (ComponentOptions) => boolean
export interface NoArgumentConstructable {
    new (): any
    name?: any
    vueComponentOptions?: ComponentOptions
    decorators: {[key:string]: Decorator[]}
}

function isNoArgumentConstructable(arg: any): arg is NoArgumentConstructable {
    return arg instanceof Function
}

const lifeCycleHooks = [
        'beforeCreate', 'created',
        'beforeMount', 'mounted',
        'activated', 'deactivated',
        'beforeUpdate', 'updated',
        'beforeDestroy', 'destroyed',
        'render', /* not a lifecyle hook, but handled identically */
]

let makeObject = obj => key => ({ key: obj[key] })
let getMethod  = obj => key => Object.getOwnPropertyDescriptor(obj, key).value

let legalDataKey          = key => key[0] !== '_' && key[0] !== '$'
let legalLifeCycleHookKey = key => lifeCycleHooks.indexOf(key) !== -1
let legalComputedKey      = key => Object.getOwnPropertyDescriptor({} /* prototype */, key).get
let legalMethodKey        = key => !legalLifeCycleHookKey(key) &&
                                             !legalComputedKey(key) &&
                                              key !== 'construct'

function makeComponentDecorator(options: ComponentOptions = {}): ComponentDecorator {
    return (Component: NoArgumentConstructable) => {
        const component = new Component()
        const prototype = Component.prototype

        let andDecorate = (key: string) => {
            let decorators = Component.decorators[key] || []

            return ! decorators.reduce(
                (result, decorator) => decorator(options) || result,
                false
            )
        }

        let componentKeys = Object.getOwnPropertyNames(component).filter(andDecorate)
        let prototypeKeys = Object.getOwnPropertyNames(prototype).filter(andDecorate)

        let dataKeys          = componentKeys.filter(legalDataKey)
        let methodKeys        = prototypeKeys.filter(legalMethodKey)
        let computedKeys      = prototypeKeys.filter(legalComputedKey)
        let lifeCycleHookKeys = prototypeKeys.filter(legalLifeCycleHookKey)
        
        options.methods       = methodKeys.mapToObject(makeObject(component))
        options.computed      = computedKeys.mapToObject( key => {
            let pd = Object.getOwnPropertyDescriptor(prototype, key)
            return { key: { get: pd.get, set: pd.set } }
        })

        objAssign(options, lifeCycleHookKeys.map(getMethod(prototype)))

        const superOptions = Component.vueComponentOptions || {}
        options.name       = options.name || (<any>Component).name
        options.methods    = objAssign( {}, superOptions.methods,  options.methods  )
        options.computed   = objAssign( {}, superOptions.computed, options.computed )
        options.watch      = objAssign( {}, superOptions.watch,    options.watch    )
        options.props      = objAssign( {}, superOptions.props,    options.props    )

        Component.vueComponentOptions = options
    }
}

function getData(keys: string[], options: ComponentOptions, component: any) {
    let dataKeys = keys.filter(key => key[0] !== '_' && key[0] !== '$')
    options.data = () => dataKeys.mapToObject(makeObject(component))
}

function getMethods(keys: string[], options: ComponentOptions, prototype: any) {
    let dataKeys = keys.filter(key => key !== 'constructor')

    for (let key of dataKeys) {
        let method = getMethod(prototype)(key)
        if (method) { options.methods[key] = method }
    }
}

function getComputed(keys: string[], options: ComponentOptions, prototype: any) {
    let computedKeys = keys.filter(key => Object.getOwnPropertyDescriptor(prototype, key).get)
    options.computed = computedKeys.mapToObject( key => {
        let pd = Object.getOwnPropertyDescriptor(prototype, key)
        return { key: { get: pd.get, set: pd.set } }
    })
}

function getLifeCycleHooks(keys: string[], options: ComponentOptions, prototype: any) {
    let lifeCycleHookKeys = keys.filter(key => lifeCycleHooks.indexOf(key) !== -1)
    objAssign(options, lifeCycleHookKeys.map(getMethod(prototype)))
}

/** Create property constructor.vueComponentOptions based on method/field annotations
 *  If provided, use options as the base value (.data is always overridden)
 */
export type ComponentDecorator = (cls: NoArgumentConstructable) => void
export function component(cls: NoArgumentConstructable): void
export function component(options: ComponentOptions): ComponentDecorator
export function component(options: ComponentOptions | NoArgumentConstructable): ComponentDecorator | void {
    if (isNoArgumentConstructable(options)) {
        return makeComponentDecorator()(options)
    } else {
        return makeComponentDecorator(options)
    }
}
