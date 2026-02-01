// assets/lookups.js
import { db, FS } from "./firebase.js";

/**
 * Lookup storage:
 * Collection: lookups
 * Docs: { type: "to" | "from", name: string, isActive: true, createdAt, updatedAt }
 */

export async function fetchLookups(type){
  const qy = FS.query(
    FS.collection(db, "lookups"),
    FS.orderBy("name","asc"),
    FS.limit(500)
  );
  const snaps = await FS.getDocs(qy);
  return snaps.docs.map(d=>({ id:d.id, ...d.data() }))
    .filter(x => x && (x.isActive ?? true) && x.type === type)
    .map(x => ({ id:x.id, name: x.name || "" }))
    .filter(x => x.name.trim().length>0);
}

export async function fillSelectWithLookups(selectEl, type, { includeDash=true } = {}){
  if(!selectEl) return;
  const current = selectEl.value;
  const list = await fetchLookups(type);

  const opts = [];
  if(includeDash) opts.push({ name:"—" });
  for(const x of list) opts.push({ name:x.name });

  selectEl.innerHTML = opts.map(o=>`<option value="${escapeHtml(o.name)}">${escapeHtml(o.name)}</option>`).join("");
  if(opts.some(o=>o.name===current)) selectEl.value = current;
}

function escapeHtml(s){
  return (s??"").toString().replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}
