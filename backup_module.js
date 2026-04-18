
  import { auth, db, AUTH, FS } from "./assets/firebase.js";
  import { qs, toast, setActiveNav } from "./assets/ui.js";

  setActiveNav();

  const logout = qs("btnLogout");
  logout?.addEventListener("click", async ()=>{
    await AUTH.signOut(auth);
    location.href = "index.html";
  });

  const statusBox = qs("statusBox");
  const btnDownload = qs("btnDownload");
  const fileRestore = qs("fileRestore");

  function log(msg, reset=false){
    if(reset) statusBox.textContent = "";
    statusBox.textContent = (statusBox.textContent ? statusBox.textContent + "\n" : "") + msg;
  }

  function nowISO(){
    const d = new Date();
    const pad=n=>String(n).padStart(2,"0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  }

  function downloadText(fileName, text){
    const blob = new Blob([text], {type:"application/json;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  function normalizeForBackup(value){
    if(value === null || value === undefined) return value;
    if(Array.isArray(value)) return value.map(normalizeForBackup);

    if(typeof value === "object"){
      if(typeof value.toDate === "function"){
        return { __type: "timestamp", iso: value.toDate().toISOString() };
      }
      if(value instanceof Date){
        return { __type: "date", iso: value.toISOString() };
      }
      const out = {};
      for(const [k,v] of Object.entries(value)) out[k] = normalizeForBackup(v);
      return out;
    }

    return value;
  }

  function reviveFromBackup(value){
    if(value === null || value === undefined) return value;
    if(Array.isArray(value)) return value.map(reviveFromBackup);

    if(typeof value === "object"){
      if(value.__type === "timestamp" && value.iso) return new Date(value.iso);
      if(value.__type === "date" && value.iso) return new Date(value.iso);
      const out = {};
      for(const [k,v] of Object.entries(value)) out[k] = reviveFromBackup(v);
      return out;
    }

    return value;
  }

  async function getAllDocs(colName){
    const snap = await FS.getDocs(FS.collection(db, colName));
    return snap.docs.map(d => normalizeForBackup({ id: d.id, ...d.data() }));
  }

  async function getIncomingWithFollowups(){
    const incomingSnap = await FS.getDocs(FS.collection(db,"incoming"));
    const incoming = [];
    for(const docu of incomingSnap.docs){
      const data = docu.data();
      const inId = docu.id;
      const fuSnap = await FS.getDocs(FS.collection(db,"incoming",inId,"followups"));
      const followups = fuSnap.docs.map(d => normalizeForBackup({ id: d.id, ...d.data() }));
      incoming.push(normalizeForBackup({ id: inId, ...data, __followups: followups }));
    }
    return incoming;
  }

  async function backup(){
    log("بدء إنشاء النسخة الاحتياطية الكاملة...", true);

    const payload = {
      meta: {
        createdAt: new Date().toISOString(),
        app: "MIFT FollowUp",
        version: "backup-v2-full",
        scope: "full-database"
      },
      data: {}
    };

    log("تحميل users ...");
    payload.data.users = await getAllDocs("users");
    log(`تم تحميل users: ${payload.data.users.length}`);

    log("تحميل lookups ...");
    payload.data.lookups = await getAllDocs("lookups");
    log(`تم تحميل lookups: ${payload.data.lookups.length}`);

    log("تحميل outgoing ...");
    payload.data.outgoing = await getAllDocs("outgoing");
    log(`تم تحميل outgoing: ${payload.data.outgoing.length}`);

    log("تحميل incoming + followups ...");
    payload.data.incoming = await getIncomingWithFollowups();
    log(`تم تحميل incoming: ${payload.data.incoming.length}`);
    let totalFU = 0;
    for(const x of payload.data.incoming){ totalFU += (x.__followups||[]).length; }
    log(`إجمالي المتابعات: ${totalFU}`);

    payload.meta.counts = {
      users: payload.data.users.length,
      lookups: payload.data.lookups.length,
      outgoing: payload.data.outgoing.length,
      incoming: payload.data.incoming.length,
      followups: totalFU
    };

    const fileName = `backup_full_${nowISO()}.json`;
    downloadText(fileName, JSON.stringify(payload, null, 2));
    log("تم إنشاء وتحميل النسخة الاحتياطية الكاملة بنجاح.");
  }

  async function deleteCollection(colRef){
    const snap = await FS.getDocs(colRef);
    for(const d of snap.docs){
      await FS.deleteDoc(d.ref);
    }
  }

  async function clearIncomingAndFollowups(){
    const incomingSnap = await FS.getDocs(FS.collection(db,"incoming"));
    for(const docu of incomingSnap.docs){
      const fuRef = FS.collection(db,"incoming",docu.id,"followups");
      await deleteCollection(fuRef);
      await FS.deleteDoc(docu.ref);
    }
  }

  function validatePayload(payload){
    return !!(
      payload && payload.data &&
      Array.isArray(payload.data.users) &&
      Array.isArray(payload.data.lookups) &&
      Array.isArray(payload.data.outgoing) &&
      Array.isArray(payload.data.incoming)
    );
  }

  async function restoreFrom(payload){
    log("بدء استرجاع النسخة الاحتياطية...", true);

    if(!validatePayload(payload)){
      toast("ملف النسخة الاحتياطية غير صالح أو غير كامل.");
      log("تم إيقاف العملية: ملف غير صالح أو لا يحتوي على نسخة كاملة.");
      return;
    }

    if(!confirm("سيتم مسح البيانات الحالية بالكامل ثم استرجاع النسخة الاحتياطية. هل أنت متأكد؟")) return;

    try{
      log("مسح incoming + followups ...");
      await clearIncomingAndFollowups();
      log("تم مسح incoming + followups");

      log("مسح outgoing ...");
      await deleteCollection(FS.collection(db,"outgoing"));
      log("تم مسح outgoing");

      log("مسح lookups ...");
      await deleteCollection(FS.collection(db,"lookups"));
      log("تم مسح lookups");

      log("مسح users ...");
      await deleteCollection(FS.collection(db,"users"));
      log("تم مسح users");
    }catch(e){
      console.error(e);
      toast("تعذر مسح البيانات الحالية. تحقق من صلاحيات مدير النظام.");
      log("فشل أثناء مسح البيانات الحالية.");
      return;
    }

    try{
      log("استرجاع users ...");
      for(const u0 of payload.data.users){
        const u = reviveFromBackup(u0);
        const id = u.id; const data = { ...u }; delete data.id;
        await FS.setDoc(FS.doc(db,"users",id), data);
      }
      log("تم استرجاع users");

      log("استرجاع lookups ...");
      for(const l0 of payload.data.lookups){
        const l = reviveFromBackup(l0);
        const id = l.id; const data = { ...l }; delete data.id;
        await FS.setDoc(FS.doc(db,"lookups",id), data);
      }
      log("تم استرجاع lookups");

      log("استرجاع outgoing ...");
      for(const o0 of payload.data.outgoing){
        const o = reviveFromBackup(o0);
        const id = o.id; const data = { ...o }; delete data.id;
        await FS.setDoc(FS.doc(db,"outgoing",id), data);
      }
      log("تم استرجاع outgoing");

      log("استرجاع incoming + followups ...");
      let totalFU = 0;
      for(const inc0 of payload.data.incoming){
        const inc = reviveFromBackup(inc0);
        const id = inc.id;
        const data = { ...inc };
        const followups = data.__followups || [];
        delete data.id;
        delete data.__followups;

        await FS.setDoc(FS.doc(db,"incoming",id), data);

        for(const fu of followups){
          const fuId = fu.id;
          const fuData = { ...fu };
          delete fuData.id;
          await FS.setDoc(FS.doc(db,"incoming",id,"followups",fuId), fuData);
          totalFU += 1;
        }
      }
      log("تم استرجاع incoming + followups");
      log(`إجمالي المتابعات المسترجعة: ${totalFU}`);

      toast("تم استرجاع النسخة الاحتياطية الكاملة بنجاح.", true);
      log("اكتملت عملية الاسترجاع بنجاح.");
    }catch(e){
      console.error(e);
      toast("حدث خطأ أثناء الاسترجاع. راجع صلاحيات مدير النظام وصحة الملف.");
      log("فشل أثناء استرجاع البيانات من الملف.");
    }
  }

  AUTH.onAuthStateChanged(auth, async (user)=>{
    if(!user){ location.href="index.html"; return; }

    const snap = await FS.getDoc(FS.doc(db,"users",user.uid));
    if(!snap.exists()){
      await AUTH.signOut(auth);
      location.href="index.html";
      return;
    }
    const me = snap.data();
    if(me.status !== "active"){
      toast("الحساب قيد المراجعة أو موقوف.");
      await AUTH.signOut(auth);
      location.href="index.html";
      return;
    }

    qs("whoName").textContent = me.name || me.email || "مستخدم";
    qs("whoRole").textContent = (me.role==="admin") ? "مدير نظام" : (me.role==="followup_manager" ? "مدير المتابعة" : "مستخدم");

    const adminLink = qs("adminLink");
    if(adminLink) adminLink.style.display = (me.role==="admin") ? "" : "none";
    const lookupsLink = qs("lookupsLink");
    if(lookupsLink) lookupsLink.style.display = (me.role==="admin" || me.role==="followup_manager") ? "" : "none";
    const reportsLink = qs("reportsLink");
    if(reportsLink) reportsLink.style.display = "";
    const backupLink = qs("backupLink");
    if(backupLink) backupLink.style.display = (me.role==="admin") ? "" : "none";

    if(me.role !== "admin"){
      toast("هذه الشاشة متاحة لمدير النظام فقط.");
      location.href="incoming.html";
      return;
    }

    btnDownload.addEventListener("click", backup);
    fileRestore.addEventListener("change", async (e)=>{
      const f = e.target.files?.[0];
      if(!f) return;
      try{
        const text = await f.text();
        const payload = JSON.parse(text);
        await restoreFrom(payload);
      }catch(err){
        console.error(err);
        toast("تعذر قراءة ملف النسخة الاحتياطية أو تحليله.");
        log("فشل في قراءة الملف المحدد.");
      }finally{
        fileRestore.value = "";
      }
    });
  });
