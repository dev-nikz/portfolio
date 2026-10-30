const form=document.querySelector('#enquiry-form');
if(form){
  document.querySelectorAll('[data-enquiry]').forEach(link=>link.addEventListener('click',()=>{
    form.elements.type.value=link.dataset.enquiry;
    form.querySelector('input[name="name"]').focus({preventScroll:true});
  }));
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(!form.reportValidity())return;
    const status=document.querySelector('#enquiry-status'),button=form.querySelector('button[type="submit"]');
    button.disabled=true;button.textContent='Sending…';status.textContent='';
    try{
      const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form))),signal:AbortSignal.timeout(15000)});
      const result=await response.json();status.textContent=result.message;
      if(response.ok)form.reset();
    }catch{status.textContent='Your enquiry could not be sent. Please try again, or email nikzdev@gmail.com. Your message has been kept.';}
    finally{button.disabled=false;button.textContent='Send enquiry ↗';}
  });
}
