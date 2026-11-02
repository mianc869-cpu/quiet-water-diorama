export class UIOverlay {
 root=document.createElement('div');
 message=document.createElement('div');
 count=document.createElement('span');
 constructor(reset:()=>void){
  this.root.className='overlay';
  const poem=document.createElement('p');
  poem.className='poem';
  poem.textContent='把时间，交给水。';
  const button=document.createElement('button');
  button.className='reset-view';
  button.setAttribute('aria-label','恢复默认视角');
  button.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 9a7 7 0 1 1-.1 5M5 4v5h5"/></svg>';
  button.onclick=reset;
  const help=document.createElement('p');
  help.className='sr-only';help.id='scene-instructions';
  help.textContent='点击人物或鱼竿抛竿。鱼漂下沉后点击鱼漂或按空格收线。点击水面产生波纹。滚轮或双指缩放。右上方图标恢复默认视角。';
  document.querySelector('canvas')?.setAttribute('aria-describedby',help.id);
  this.message.className='sr-only';this.message.setAttribute('role','status');
  this.count.className='sr-only';this.count.textContent='捕获 0';
  this.root.append(button,help,this.count,this.message);
  document.body.append(this.root);
 }
 // Interactive geometry retains its pointer cursor, without floating text labels.
 hover(_label:string,_x:number,_y:number){}
 toast(text:string){this.message.textContent=text;}
 caught(n:number){this.count.textContent=`捕获 ${n}`;this.toast(`钓鱼成功，目前捕获 ${n} 条鱼。`);}
 dispose(){this.root.remove();}
}
