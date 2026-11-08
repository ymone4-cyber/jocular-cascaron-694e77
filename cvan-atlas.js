(() => {
  "use strict";
  const entries=[
    {id:"logo",no:"CVAN · 01",name:"CVAN.ONLINE",sub:"Le parcours d’apprentissage",family:"Plateforme CVAN",image:"/assets/cvan-logo.jpg",tags:["Logique","Raisonnement","Psychologie"],lede:"Un parcours guidé pour travailler la logique déductive, le raisonnement quantitatif et la psychologie appliquée.",caption:"Un espace pour apprendre avec méthode.",close:"Découvrez les trois domaines de l’évaluation CVAN.",feature:["Apprendre avec méthode.","Un parcours clair, organisé en trois étapes."],range:[0,28],era:"Parcours CVAN",traits:[["wing","Étapes","3 domaines"],["time","Questions","6 par étape"],["check","Validation","4 bonnes réponses sur 6"]],habitat:"En ligne · accessible depuis votre navigateur."},
    {id:"router",no:"OUTIL · 02",name:"La connexion",sub:"Accès en ligne",family:"Pour accéder au parcours",image:"/assets/router.jpg",tags:["Accès","Internet","En ligne"],lede:"Une connexion Internet permet d’ouvrir CVAN.ONLINE et de suivre l’évaluation depuis votre navigateur.",caption:"Le parcours CVAN, accessible en ligne.",close:"L’évaluation est proposée depuis le site CVAN.ONLINE.",feature:["Rester connecté.","Ouvrez le parcours depuis un appareil connecté."],range:[20,44],era:"Accès au site",traits:[["range","Accès","Navigateur web"],["speed","Parcours","En ligne"],["check","Conseil","Vérifiez la connexion"]],habitat:"Ordinateur, tablette ou téléphone connecté."},
    {id:"pen",no:"OUTIL · 03",name:"Le stylo Bic",sub:"Prendre le temps de réfléchir",family:"Outil de réflexion",image:"/assets/bic-pen.jpg",tags:["Notes","Méthode","Réflexion"],lede:"Gardez de quoi écrire à portée de main pour poser votre démarche et organiser vos idées pendant les exercices.",caption:"Une idée posée aide à suivre son raisonnement.",close:"Notez les étapes de votre réflexion avant de valider.",feature:["Clarifier ses idées.","Avancez question après question."],range:[42,63],era:"S’entraîner",traits:[["wing","Démarche","Étape par étape"],["time","Rythme","Prenez votre temps"],["check","Méthode","Relire avant d’envoyer"]],habitat:"Un brouillon peut aider à structurer votre réponse."},
    {id:"guide",no:"RESSOURCE · 04",name:"Guide CVAN",sub:"Stratégies de Croissance",family:"Guide présenté dans vos visuels",image:"/assets/cvan-guide.jpg",tags:["Guide CVAN","Ressource","Croissance"],lede:"Le guide CVAN présenté ici accompagne l’identité visuelle de votre plateforme et ses ressources pédagogiques.",caption:"Un guide pour accompagner la progression.",close:"Explorez les ressources CVAN avec votre enseignant.",feature:["Guide CVAN.","Une ressource à retrouver dans l’espace pédagogique."],range:[60,81],era:"Ressources",traits:[["wing","Support","Guide CVAN"],["time","Thème","Stratégies de croissance"],["check","Usage","Lecture et apprentissage"]],habitat:"Consultez les ressources partagées par l’équipe CVAN."},
    {id:"laptop",no:"PARCOURS · 05",name:"L’évaluation en ligne",sub:"Votre espace de travail",family:"Évaluation CVAN",image:"/assets/laptop.jpg",tags:["Évaluation","Étudiant","En ligne"],lede:"Retrouvez le parcours étudiant sur CVAN.ONLINE. Les réponses sont organisées en trois étapes, avec une progression et un résultat à la fin.",caption:"Ouvrez l’évaluation et avancez à votre rythme.",close:"Lancez l’évaluation depuis le bouton Commencer.",feature:["Prêt à commencer ?","Accédez aux questions de l’évaluation en ligne."],range:[75,100],era:"Évaluation",traits:[["wing","Étapes","3 étapes"],["time","Questions","6 par étape"],["check","Seuil","4 / 6 pour valider"]],habitat:"Les questions actives s’ouvrent dans l’espace étudiant."}
  ];
  const $=id=>document.getElementById(id),hero=$("hero"),stage=$("atlas-stage"),detail=$("detail"),tabs=[...document.querySelectorAll(".atlas-tab")],nav=[...document.querySelectorAll("#atlas-nav [data-select]")],canvas=$("atlas-canvas"),loader=$("atlas-loader"),fallback=$("atlas-fallback"),featureImg=$("featImg"),featureTitle=$("featTitle"),featureText=$("featText");
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  let active=0,zoomGoal=1,zoom=1,velX=0,velY=0,yaw=0,pitch=.05,yawQueue=0,drag=false,dragged=false,lastX=0,lastY=0,lastTouch=performance.now(),lastFrame=performance.now(),focus=false,THREE=null,renderer=null,scene=null,camera=null,pivot=null,cardMesh=null,textureCache=new Map(),enterAt=0,enterDir=1,noticeTimer=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,k)=>a+(b-a)*k,rate=(dt,r)=>1-Math.exp(-dt*r),smooth=t=>t*t*(3-2*t),back=t=>1+2.2*Math.pow(t-1,3)+1.2*Math.pow(t-1,2);
  function esc(s){return String(s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
  const glyph={
    wing:'<path d="M3 15c3-6 8-9 15-9.5 1.5 0 3 .3 3 .3-1.5 1.5-2.5 4-4.5 5.5C13 14 8.5 15 3 15z"/><path d="M3 15c3.5.5 7 1.5 9.5 4.5"/>',
    time:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    range:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.3 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.3-3.5-8.5s1-6 3.5-8.5z"/>',
    speed:'<path d="M4 16a8.5 8.5 0 1 1 16 0M12 14l3.5-4.5M8 19h8"/>'
  };
  function icon(key){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(glyph[key]||glyph.check)+'</svg>'}
  function paintInfo(index,instant){
    const item=entries[index],fill=()=>{
      const start=item.range[0],width=Math.max(.8,item.range[1]-item.range[0]);
      detail.innerHTML=
        '<div class="atlas-eyebrow" style="--i:0">'+esc(item.family)+' · '+esc(item.no)+'</div>'+
        '<h1 style="--i:1">'+esc(item.name)+'<em>'+esc(item.sub)+'</em></h1>'+
        '<div class="atlas-tags" style="--i:2">'+item.tags.map(t=>'<span>'+esc(t)+'</span>').join("")+'</div>'+
        '<p class="atlas-lede" style="--i:3">'+esc(item.lede)+'</p>'+
        '<div class="atlas-era" style="--i:4"><div class="bar"><b></b><b></b><b></b><i class="marker '+(start<50?"left":"")+'" style="left:'+start+'%;width:'+width+'%" data-label="'+esc(item.era)+'"></i></div><div class="labels"><span>Découvrir</span><span>S’exercer</span><span>Valider</span></div></div>'+
        '<h2 style="--i:5">Repères du parcours</h2>'+
        '<dl class="atlas-traits" style="--i:6">'+item.traits.map(row=>'<div>'+icon(row[0])+'<dt>'+esc(row[1])+'</dt><span></span><dd>'+esc(row[2])+'</dd></div>').join("")+'</dl>'+
        '<h2 style="--i:7">Pour continuer</h2>'+
        '<p class="atlas-habitat" style="--i:8">'+icon("range")+'<span>'+esc(item.habitat)+'</span></p>';
      $("caption").textContent=item.caption;$("scale").textContent=item.no+" · VUE INTERACTIVE";
      $("lens").style.backgroundImage='url("'+item.image+'")';$("closeText").textContent=item.close;$("closeTitle").textContent="Voir de plus près";$("closeup").setAttribute("aria-pressed","false");
      featureImg.src=item.image;featureTitle.textContent=item.feature[0];featureText.textContent=item.feature[1];
      detail.scrollTop=0;
    };
    if(instant||reduced.matches){detail.classList.remove("leaving");fill();return}
    detail.classList.add("leaving");setTimeout(()=>{fill();detail.classList.remove("leaving")},170);
  }
  function select(index){
    index=(index+entries.length)%entries.length;if(index===active)return;
    const dir=Math.sign(index-active)||1;active=index;enterDir=dir;enterAt=performance.now();lastTouch=enterAt;yaw=0;pitch=.05;velX=velY=yawQueue=0;zoom=1;setZoom(1);
    tabs.forEach((tab,i)=>{tab.setAttribute("aria-selected",i===index?"true":"false");tab.tabIndex=i===index?0:-1});
    nav.forEach((button,i)=>{if(i===index)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current")});
    paintInfo(index,false);updateFallback();
    if(pivot){while(pivot.children.length)pivot.remove(pivot.children[0]);addPhotoObject(index);pivot.scale.setScalar(.001)}
    hero.classList.add("switching");setTimeout(()=>hero.classList.remove("switching"),reduced.matches?1:350);
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener("click",()=>select(i));
    tab.addEventListener("focus",()=>select(i));
    tab.addEventListener("keydown",e=>{let next=i;if(e.key==="ArrowRight")next=(i+1)%tabs.length;else if(e.key==="ArrowLeft")next=(i+tabs.length-1)%tabs.length;else return;e.preventDefault();tabs[next].focus();select(next)});
  });
  nav.forEach((button,i)=>button.addEventListener("click",()=>select(i)));
  $("atlas-search").addEventListener("input",e=>{
    const q=e.target.value.trim().toLocaleLowerCase("fr");
    tabs.forEach((tab,i)=>{const item=entries[i];tab.hidden=!!q&&!([item.name,item.sub,item.family,...item.tags].join(" ").toLocaleLowerCase("fr").includes(q))});
  });
  $("bell").addEventListener("click",()=>{const b=$("bell"),isOn=b.getAttribute("aria-pressed")==="true";b.setAttribute("aria-pressed",String(!isOn));b.title=isOn?"Informations":"Parcours CVAN : 3 étapes, 6 questions par étape, validation à 4/6";$("caption").textContent=isOn?entries[active].caption:"Le parcours comporte 3 étapes. Il faut 4 bonnes réponses sur 6 pour valider chaque étape.";clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{$("caption").textContent=entries[active].caption;b.setAttribute("aria-pressed","false")},5000)});
  document.querySelectorAll("[data-cvan-scroll-app]").forEach(b=>b.addEventListener("click",startEvaluation));
  function startEvaluation(){if(typeof window.showSiteView==="function")window.showSiteView("evaluation");const app=$("app");if(app){window.setTimeout(()=>app.scrollIntoView({behavior:reduced.matches?"auto":"smooth",block:"start"}),30)}}
  function touched(){lastTouch=performance.now();hero.classList.add("touched")}
  function setZoom(value){zoomGoal=clamp(value,.55,3.4);$("zoomIn").classList.toggle("on",zoomGoal>=1);$("zoomOut").classList.toggle("on",zoomGoal<1);$("closeup").setAttribute("aria-pressed",String(zoomGoal>2.2));$("closeTitle").textContent=zoomGoal>2.2?"Vue rapprochée":"Voir de plus près";touched()}
  function toggleFocus(){focus=!focus;hero.classList.toggle("focus",focus);$("expand").classList.toggle("on",focus);$("expand").setAttribute("aria-pressed",String(focus));$("expand").setAttribute("aria-label",focus?"Fermer la vue agrandie":"Agrandir la vue");measure()}
  function updateFallback(){fallback.style.backgroundImage='url("'+entries[active].image+'")'}
  function measure(){if(renderer)resize()}
  paintInfo(0,true);updateFallback();
  const pointers=new Map();let pinchStart=0,pinchZoom=1,viewPx=200,textureLoader=null,keyLight=null,rimLight=null;
  function getTexture(item){
    if(textureCache.has(item.id))return textureCache.get(item.id);
    const promise=new Promise((resolve,reject)=>textureLoader.load(item.image,tex=>{tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();resolve(tex)},undefined,reject));
    textureCache.set(item.id,promise);return promise;
  }
  function addPhotoObject(index){
    if(!THREE||!pivot||!textureLoader)return;
    while(pivot.children.length)pivot.remove(pivot.children[0]);
    const item=entries[index],spin=new THREE.Group(),root=new THREE.Group();pivot.add(spin);spin.add(root);
    const sizes=item.id==="guide"?[.98,1.18]:item.id==="laptop"||item.id==="router"?[1.32,1.02]:item.id==="pen"?[1.38,1.02]:[1.12,1.12],w=sizes[0],h=sizes[1];
    const frameMat=new THREE.MeshStandardMaterial({color:hero.dataset.light==="dusk"?0x30261a:0xe4d8c2,roughness:.82,metalness:.04});
    const frame=new THREE.Mesh(new THREE.BoxGeometry(w+.18,h+.18,.12),frameMat);frame.castShadow=true;frame.receiveShadow=true;root.add(frame);
    const photoMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.78,metalness:0});
    const photo=new THREE.Mesh(new THREE.PlaneGeometry(w,h),photoMat);photo.position.z=.066;root.add(photo);cardMesh=photo;
    getTexture(item).then(tex=>{photoMat.map=tex;photoMat.needsUpdate=true;fallback.classList.remove("show")}).catch(()=>{fallback.classList.add("show")});
    const trimMat=new THREE.MeshStandardMaterial({color:hero.dataset.light==="dusk"?0x866b4e:0xbba98c,roughness:.55,metalness:.18});
    if(item.id==="logo"){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.69,.025,8,56),trimMat);ring.position.z=-.085;root.add(ring);
    }else if(item.id==="router"){
      for(let j=0;j<4;j++){const antenna=new THREE.Mesh(new THREE.CylinderGeometry(.014,.018,.48,10),trimMat);antenna.position.set(-.47+j*.31,h*.52,.0);antenna.rotation.z=(j<2?-.12:.12);root.add(antenna)}
    }else if(item.id==="pen"){
      const body=new THREE.Mesh(new THREE.CylinderGeometry(.026,.035,1.14,12),trimMat);body.rotation.z=Math.PI/2;body.position.set(0,-h*.54,.04);root.add(body);
      const cap=new THREE.Mesh(new THREE.CylinderGeometry(.034,.038,.25,12),new THREE.MeshStandardMaterial({color:0x315d9a,roughness:.45,metalness:.14}));cap.rotation.z=Math.PI/2;cap.position.set(.69,-h*.54,.04);root.add(cap);
    }else if(item.id==="guide"){
      const pages=new THREE.Mesh(new THREE.BoxGeometry(w+.07,h+.07,.08),new THREE.MeshStandardMaterial({color:0xf1eadc,roughness:.9}));pages.position.set(.035,0,-.08);root.add(pages);
      const spine=new THREE.Mesh(new THREE.BoxGeometry(.09,h+.14,.15),trimMat);spine.position.x=-w*.52;root.add(spine);
    }else if(item.id==="laptop"){
      const base=new THREE.Mesh(new THREE.BoxGeometry(1.43,.075,.62),frameMat);base.position.set(0,-h*.63,-.02);root.add(base);
      const hinge=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.1,12),trimMat);hinge.rotation.z=Math.PI/2;hinge.position.set(0,-h*.52,-.02);root.add(hinge);
    }
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(.72,48),new THREE.MeshBasicMaterial({color:hero.dataset.light==="dusk"?0x100d09:0x8d7a60,transparent:true,opacity:.09,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(0,-1.18,-.06);root.add(shadow);
    updateFallback();
  }
  function createScene(T){
    THREE=T;scene=new T.Scene();camera=new T.PerspectiveCamera(26,1,.1,100);camera.position.set(0,0,5);
    renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1.05;
    scene.add(new T.HemisphereLight(0xf6ead7,0x76634d,1.25));
    keyLight=new T.DirectionalLight(0xfff4e2,1.6);keyLight.position.set(2.5,4,5);scene.add(keyLight);
    rimLight=new T.DirectionalLight(0xbfd8ff,.5);rimLight.position.set(-4,2,-3);scene.add(rimLight);
    pivot=new T.Group();scene.add(pivot);textureLoader=new T.TextureLoader();textureLoader.setCrossOrigin("anonymous");
    addPhotoObject(active);resize();
    setTimeout(()=>loader.classList.add("hide"),320);
    requestAnimationFrame(render);
  }
  function resize(){
    if(!renderer||!camera)return;
    const h=hero.getBoundingClientRect(),s=stage.getBoundingClientRect(),W=Math.max(1,h.width),H=Math.max(1,h.height),cx=s.left-h.left+s.width/2,cy=s.top-h.top+s.height*.46;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(W,H,false);camera.aspect=W/H;camera.setViewOffset(W,H,W/2-cx,H/2-cy,W,H);
    viewPx=Math.min(s.width*.5,s.height*.6)*1.16;camera.position.z=H/(2*Math.tan(THREE.MathUtils.degToRad(26/2))*viewPx*zoom);camera.updateProjectionMatrix();
  }
  const resizeObserver=new ResizeObserver(()=>resize());resizeObserver.observe(hero);resizeObserver.observe(stage);window.addEventListener("orientationchange",resize,{passive:true});
  function pointerDistance(){const p=[...pointers.values()];return Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}
  stage.addEventListener("pointerdown",e=>{
    if(e.target.closest("button"))return;
    stage.focus({preventScroll:true});stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===1){drag=true;dragged=false;lastX=e.clientX;lastY=e.clientY;stage.classList.add("dragging")}
    if(pointers.size===2){pinchStart=pointerDistance();pinchZoom=zoomGoal;drag=false;stage.classList.remove("dragging")}
    touched();
  });
  stage.addEventListener("pointermove",e=>{
    if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size>=2){const d=pointerDistance();if(pinchStart>0)setZoom(pinchZoom*d/pinchStart);return}
    if(!drag)return;const dx=e.clientX-lastX,dy=e.clientY-lastY,k=Math.PI/Math.max(260,viewPx*1.6);yaw+=dx*k;pitch=clamp(pitch+dy*k,-1.2,1.2);velX=dx*k;velY=dy*k;lastX=e.clientX;lastY=e.clientY;dragged=dragged||Math.abs(dx)+Math.abs(dy)>2;touched();
  });
  function stopPointer(e){pointers.delete(e.pointerId);if(!pointers.size){drag=false;stage.classList.remove("dragging")}if(pointers.size<2)pinchStart=0}
  stage.addEventListener("pointerup",stopPointer);stage.addEventListener("pointercancel",stopPointer);
  stage.addEventListener("wheel",e=>{e.preventDefault();setZoom(zoomGoal*Math.exp(-e.deltaY*(e.ctrlKey?.01:.0016)))},{passive:false});
  stage.addEventListener("dblclick",resetView);
  stage.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&focus){toggleFocus();e.preventDefault();return}
    if(e.key==="0"){resetView();e.preventDefault()}
    else if(e.key==="ArrowLeft"){yaw-=.18;touched();e.preventDefault()}
    else if(e.key==="ArrowRight"){yaw+=.18;touched();e.preventDefault()}
    else if(e.key==="ArrowUp"){pitch=clamp(pitch-.16,-1.2,1.2);touched();e.preventDefault()}
    else if(e.key==="ArrowDown"){pitch=clamp(pitch+.16,-1.2,1.2);touched();e.preventDefault()}
    else if(e.key==="+"||e.key==="="){setZoom(zoomGoal*1.2);e.preventDefault()}
    else if(e.key==="-"){setZoom(zoomGoal/1.2);e.preventDefault()}
  });
  function resetView(){yaw=0;pitch=.05;velX=velY=0;yawQueue=0;setZoom(1);touched()}
  function render(now){
    requestAnimationFrame(render);if(document.hidden||!renderer)return;
    const dt=Math.min(.05,Math.max(.001,(now-lastFrame)/1000));lastFrame=now;
    if(!drag){yaw+=velX;pitch=clamp(pitch+velY,-1.2,1.2);velX*=Math.exp(-dt*4.5);velY*=Math.exp(-dt*4.5)}
    if(Math.abs(yawQueue)>.001){const step=yawQueue*rate(dt,4.2);yaw+=step;yawQueue-=step}
    zoom=mix(zoom,zoomGoal,rate(dt,6));if(camera){const h=hero.getBoundingClientRect().height;camera.position.z=h/(2*Math.tan(THREE.MathUtils.degToRad(26/2))*viewPx*zoom)}
    const idle=reduced.matches?0:clamp((now-lastTouch-1800)/1500,0,1),s=now*.001;
    if(pivot){const entering=clamp((now-enterAt)/(reduced.matches?1:780),0,1),spring=Math.max(.0001,back(entering));pivot.scale.setScalar(enterAt?mix(.001,1,spring):1);pivot.position.set(enterDir*(1-smooth(entering))*.75,Math.sin(s*1.3+active)*.028*idle,0);pivot.rotation.set(Math.sin(s*.9)*.03*idle,0,0)}
    if(cardMesh){const spin=cardMesh.parent;spin.rotation.set(pitch+Math.sin(s*.9)*.03*idle,yaw+Math.sin(s*.55)*.16*idle,0)}
    if(keyLight&&rimLight){const dusk=hero.dataset.light==="dusk"?1:0;keyLight.intensity=mix(1.6,2.6,dusk);rimLight.intensity=mix(.5,1.9,dusk);keyLight.color.setHex(dusk?0xffc98a:0xfff4e2)}
    renderer.render(scene,camera);
  }
  function setZoom(value){zoomGoal=clamp(value,.55,3.4);$("zoomIn").classList.toggle("on",zoomGoal>=1);$("zoomOut").classList.toggle("on",zoomGoal<1);$("closeup").setAttribute("aria-pressed",String(zoomGoal>2.2));touched()}
  function touched(){lastTouch=performance.now();hero.classList.add("touched")}
  $("closeup").addEventListener("click",()=>{const on=$("closeup").getAttribute("aria-pressed")!=="true";$("closeup").setAttribute("aria-pressed",String(on));$("closeTitle").textContent=on?"Vue rapprochée":"Voir de plus près";setZoom(on?2.6:1)});
  $("zoomIn").addEventListener("click",()=>setZoom(zoomGoal*1.35));$("zoomOut").addEventListener("click",()=>setZoom(zoomGoal/1.35));
  $("turnL").addEventListener("click",()=>{yawQueue-=Math.PI/2;touched()});$("turnR").addEventListener("click",()=>{yawQueue+=Math.PI/2;touched()});$("turnFull").addEventListener("click",()=>{yawQueue+=Math.PI*2;touched()});
  $("light").addEventListener("click",()=>{const dusk=hero.dataset.light!=="dusk";hero.dataset.light=dusk?"dusk":"day";$("light").setAttribute("aria-pressed",String(dusk));$("light").setAttribute("aria-label",dusk?"Passer à la lumière du jour":"Passer en lumière du soir");touched()});
  $("expand").addEventListener("click",()=>{focus=!focus;hero.classList.toggle("focus",focus);$("expand").classList.toggle("on",focus);$("expand").setAttribute("aria-pressed",String(focus));$("expand").setAttribute("aria-label",focus?"Fermer la vue agrandie":"Agrandir la vue");measure()});
  function measure(){if(renderer)resize()}
  import("three").then(T=>{try{createScene(T)}catch(error){loader.classList.add("hide");fallback.classList.add("show");updateFallback()}}).catch(()=>{loader.classList.add("hide");fallback.classList.add("show");updateFallback()});
})();
