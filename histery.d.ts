/*!
 * Histery.js v0.8.1, https://github.com/hoho/histery
 * (c) 2013-2017 Marat Abdullin, MIT license
 */
export type HrefPartMatch = (part: string) => any;

export type HrefMatcher = string | RegExp | HrefPartMatch;

export interface HrefMatcherObject {
    pathname?: HrefMatcher
    search?: HrefMatcher
    hash?: HrefMatcher
}

export type HrefCallbackFunction = (sameMatch: boolean, href: string, ...rems: any[]) => void;

export interface HrefCallbacks {
    go?: HrefCallbackFunction,
    leave?: HrefCallbackFunction
}

export type HrefCallbacksGetter = () => HrefCallbacks;

export type HrefObject = null | undefined | HrefMatcher | HrefMatcherObject;

export type HrefCallbacksOrRewrite = HrefCallbacks | HrefCallbacksGetter | string;

declare module Histery {
    function state(key: string, value?: any): any;

    function run(): typeof Histery;

    function go(href: string, dry?: boolean, replace?: boolean): boolean;

    function on(hrefObj: HrefObject, callbacks: HrefCallbacksOrRewrite): typeof Histery;

    function off(hrefObj: HrefObject, callbacks: HrefCallbacksOrRewrite): typeof Histery;

    function eq(a: any, b: any): boolean;
}

export var $H: typeof Histery;
