import { parse } from 'querystring';
/* eslint no-useless-escape:0 import/prefer-default-export:0 */

const reg = /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/;
export const isUrl = (path) => reg.test(path);
export const isAntDesignPro = () => {
  if (ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION === 'site') {
    return true;
  }

  return window.location.hostname === 'preview.pro.ant.design';
}; // 给官方演示站点用，用于关闭真实开发环境不需要使用的特性

export const isAntDesignProOrDev = () => {
  const { NODE_ENV } = process.env;

  if (NODE_ENV === 'development') {
    return true;
  }

  return isAntDesignPro();
};
export const getPageQuery = () => parse(window.location.href.split('?')[1]);
export const findLast = (array, fn) => {
  return array.reverse().find(fn);
}
export const debounce = (func, wait=300) => {
  let timeout;  // 定时器变量
  return function(event){
    clearTimeout(timeout);  // 每次触发时先清除上一次的定时器,然后重新计时
    event.persist && event.persist()   //保留对事件的引用
    timeout = setTimeout(()=>{
      func(event)
    }, wait);  // 指定 xx ms 后触发真正想进行的操作 handler
  };
}
