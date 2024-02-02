
/**
 * @description 防抖函数
 * @param {function} func 传入函数
 * @param {number} [delay] 等待时间 默认1s
 * @param {boolean} [immediate] 是否立即执行 默认false
 * @return {function} function(...args)
 * @example ({  <input :value="text" '@'input="handleUpdate" />  handleUpdate =debounce((e)=>{text.value=e.target.value},1000,false)})
 * 
  */
export default function debounce(func, delay = 1000, immediate = false) {
    var timeout;
    return function (...args) {
      if(immediate){
          func.call(this,...args)
      }else{
        if(timeout)
          clearTimeout(timeout)
          timeout = setTimeout(()=>{
              func.call(this,...args)
          },delay)
      }
    };
  }
  
  