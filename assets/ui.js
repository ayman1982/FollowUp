// assets/ui.js
export const qs = (id)=> document.getElementById(id);
export const esc = (s)=> (s??"").toString().replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
export function toast(msg, ok=false){
  const box = document.createElement("div");
  box.className = "notice " + (ok ? "success" : "");
  box.style.position="fixed";
  box.style.bottom="18px";
  box.style.left="18px";
  box.style.zIndex="9999";
  box.style.maxWidth="520px";
  box.textContent = msg;
  document.body.appendChild(box);
  setTimeout(()=> box.remove(), 2600);
}
export function setActiveNav(){
  const path = (location.pathname.split("/").pop()||"").toLowerCase();
  document.querySelectorAll(".nav a").forEach(a=>{
    const href = (a.getAttribute("href")||"").toLowerCase();
    a.classList.toggle("active", href===path);
  });
}



// --- Client-side guards (deterrent only) ---
export function applyClientGuards({blockContextMenu=true, blockDevtools=true, blockCopy=true} = {}){
  // NOTE: This is only a deterrent. A determined user can still view source/code.
  if(blockContextMenu){
    document.addEventListener("contextmenu", (e)=>{ e.preventDefault(); }, {capture:true});
  }
  if(blockCopy){
    const prevent = (e)=>{ e.preventDefault(); };
    document.addEventListener("copy", prevent, {capture:true});
    document.addEventListener("cut", prevent, {capture:true});
    // You may disable paste if needed, but it can harm UX in login forms:
    // document.addEventListener("paste", prevent, {capture:true});
    document.addEventListener("dragstart", prevent, {capture:true});
    document.addEventListener("selectstart", prevent, {capture:true});
  }
  if(blockDevtools){
    document.addEventListener("keydown", (e)=>{
      const k = (e.key || "").toUpperCase();
      const isF12 = k === "F12";
      const isCtrlShift = e.ctrlKey && e.shiftKey && ["I","J","C"].includes(k); // DevTools shortcuts
      const isViewSource = e.ctrlKey && k === "U";
      if(isF12 || isCtrlShift || isViewSource){
        e.preventDefault();
        e.stopPropagation();
        try{ toast("غير مسموح.", false); }catch(_){ /* ignore */ }
        return false;
      }
    }, {capture:true});
  }
}

// auto-apply when this module is imported
try{ applyClientGuards(); }catch(_){}
