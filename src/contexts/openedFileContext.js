import { createContext } from 'react'
export const openedFileContext = createContext({
  current:{
    '':{
      handle:null,
      copyContext:'',
      hasChange:false,
      type:''
    }
  }
})


/* 
  {
    '/a.html':{
      handle:句柄,
      copyContext:复制的内容，主要修改这里，然后保存的时候粘回去,
      hasChange:是否已修改,
      type:html,文件类型的
    }
  }


*/
