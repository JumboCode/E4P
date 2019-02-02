import $ from 'jquery';

export function jsxElem(tag, attrs, ...children) {
  let elem = $(`<${tag}>`, attrs);
  children.forEach((child) => {elem.append(child);});
  return elem;
}
