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
