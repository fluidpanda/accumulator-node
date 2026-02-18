export function el(tag: string, className: string, text?: string): HTMLElement {
    const x: HTMLElement = document.createElement(tag);
    if (className) x.className = className;
    if (text !== undefined) x.textContent = text;
    return x;
}

export function byId<T extends HTMLElement>(id: string): T {
    const x: HTMLElement | null = document.getElementById(id);
    if (!x) throw new Error(`Missing element id="${id}"`);
    return x as T;
}

export function qs<T extends Element>(root: ParentNode, selector: string): T {
    const x: Element | null = root.querySelector(selector);
    if (!x) throw new Error(`Missing element: ${selector}`);
    return x as T;
}
