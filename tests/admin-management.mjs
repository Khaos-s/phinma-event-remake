// Isolated browser fixtures; no hosted accounts, events, passwords or posters are written.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const adminId = "10000000-0000-4000-8000-000000000001", ownerId = "10000000-0000-4000-8000-000000000002";
const cite = { id:"20000000-0000-4000-8000-000000000001", name:"CITE Council", department:"College of Information Technology" };
const management = { id:"20000000-0000-4000-8000-000000000002", name:"Fixture faculty", department:"College of Management" };
const photo = await readFile("public/images/phinma-students.jpg");
const browser = await chromium.launch({channel:"msedge",headless:true});
await mkdir(".taste-skill/admin-management",{recursive:true});
async function fixture(role="event_admin") {
  const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
  const user={id:adminId,aud:"authenticated",role:"authenticated",email:"admin-fixture@example.invalid"};
  const payload=Buffer.from(JSON.stringify({sub:adminId,exp:Math.floor(Date.now()/1000)+3600})).toString("base64url");
  const session={access_token:`e30.${payload}.fixture`,refresh_token:"fixture",expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:"bearer",user};
  await context.addCookies([{name:"sb-ulymtioaxraqvoqongrj-auth-token",value:`base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`,url:base}]);
  const calls=[], errors=[], state={failRegister:false,saveError:null,failCleanup:false,version:10};
  const organizers=[{user_id:ownerId,email:"organizer-fixture@example.invalid",organization_id:cite.id,organization_name:cite.name,department:cite.department,course:null}];
  const rows=["pending","approved","rejected"].map((status,index)=>({id:`30000000-0000-4000-8000-${String(index+1).padStart(12,"0")}`,created_by:ownerId,organization_id:cite.id,organization:cite,title:`Fixture ${status}`,description:"Fixture description",image_path:`${ownerId}/${status}.jpg`,starts_at:"2027-01-01T01:00:00Z",ends_at:"2027-01-01T02:00:00Z",department:cite.department,course:"BSIT",target_year:2,status,rejection_reason:status==="rejected"?"Clarify schedule":null,created_at:"2026-10-27T00:00:00Z",updated_at:`2026-10-27T00:00:0${index}Z`}));
  await context.route("https://*.supabase.co/**",async route=>{
    const request=route.request(),url=new URL(request.url()),path=url.pathname;
    const json=(body,status=200)=>route.fulfill({status,contentType:"application/json",headers:{"x-supabase-api-version":"2024-01-01","access-control-expose-headers":"x-supabase-api-version"},body:JSON.stringify(body)});
    if(request.method()==="OPTIONS")return route.fulfill({status:204});
    if(path==="/auth/v1/user")return json(user);
    if(path==="/rest/v1/role_assignments")return json(role==="member"?null:{role,organization_id:role==="organizer"?management.id:null,course:role==="organizer"?"BSHM":null});
    if(path==="/rest/v1/organizations")return json(url.searchParams.has("id")?management:[cite,management]);
    if(path==="/rest/v1/events")return json([]);
    if(path==="/rest/v1/rpc/workspace_events")return json(role==="organizer"?[]:rows);
    if(path==="/rest/v1/rpc/admin_organizers")return json(organizers);
    if(path==="/functions/v1/admin-register-organizer"){
      const body=request.postDataJSON();calls.push({type:"register",body});
      assert.equal(body.course,"BSHM");assert.equal(body.department,management.department);assert.equal(Object.hasOwn(body,"role"),false);
      if(state.failRegister)return json({error:"Administrator access is required."},403);
      organizers.push({user_id:"40000000-0000-4000-8000-000000000001",email:body.email,organization_id:management.id,organization_name:body.organization,department:body.department,course:body.course});
      return json({user_id:organizers.at(-1).user_id,existingAccount:false},201);
    }
    if(path==="/rest/v1/rpc/admin_save_event"){
      const body=request.postDataJSON();calls.push({type:"save",body});
      assert.equal(Object.hasOwn(body,"status"),false);assert.equal(Object.hasOwn(body,"created_by"),false);
      if(state.saveError){const failure=state.saveError;state.saveError=null;return json(failure,failure.status??400);}
      if(body.event_id){const row=rows.find(item=>item.id===body.event_id);assert.equal(body.expected_updated_at,row.updated_at);Object.assign(row,{title:body.event_title,description:body.event_description,image_path:body.poster_path,course:body.event_course,starts_at:body.event_starts_at,ends_at:body.event_ends_at,updated_at:`2026-10-27T00:00:${state.version++}Z`});return json(row.id);}
      const row={...rows[0],id:"30000000-0000-4000-8000-000000000004",created_by:adminId,organization_id:body.publisher_id,organization:management,department:management.department,title:body.event_title,description:body.event_description,image_path:body.poster_path,course:body.event_course,starts_at:body.event_starts_at,ends_at:body.event_ends_at,status:"pending",updated_at:"2026-10-27T00:00:09Z"};rows.push(row);return json(row.id);
    }
    if(path==="/rest/v1/rpc/admin_delete_event"){
      const body=request.postDataJSON();calls.push({type:"delete",body});const index=rows.findIndex(row=>row.id===body.event_id);assert.equal(body.expected_updated_at,rows[index].updated_at);const [row]=rows.splice(index,1);return json(row.image_path);
    }
    if(path.startsWith("/storage/v1/object/sign/")&&request.method()==="POST")return json({signedURL:"/object/sign/event-images/fixture.jpg?token=fixture"});
    if(path.startsWith("/storage/v1/object/sign/"))return route.fulfill({contentType:"image/jpeg",body:photo});
    if(path.startsWith("/storage/v1/object/event-images/")&&request.method()==="POST"){calls.push({type:"upload",path});return json({Key:path.split("/object/")[1]});}
    if(path==="/storage/v1/object/event-images"&&request.method()==="DELETE"){calls.push({type:"cleanup",body:request.postDataJSON()});return json(state.failCleanup?{message:"Cleanup unavailable"}:[],state.failCleanup?500:200);}
    throw Error(`Unexpected fixture request: ${request.method()} ${path}`);
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on("pageerror",error=>errors.push(error.message));
  return {context,page,calls,errors,state,rows};
}
const noOverflow=page=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
try {
  const {context,page,calls,errors,state,rows}=await fixture();
  await page.goto(`${base}/admin/users`);
  await page.getByRole("heading",{name:"Manage organizers",exact:true}).waitFor();
  await page.getByLabel("Department",{exact:true}).selectOption(management.department);
  assert.equal(await page.getByLabel("Assigned course").locator("option").count(),3);
  await page.getByLabel("Assigned course").selectOption("BSHM");
  await page.getByLabel("Email address",{exact:true}).fill("new-organizer@example.invalid");
  await page.getByLabel("Initial password").fill("x".repeat(20));
  await page.getByLabel("Publisher / organization name").fill(management.name);
  state.failRegister=true;
  await page.getByRole("button",{name:"Register organizer",exact:true}).click();
  await page.getByRole("alert").filter({hasText:"Administrator access is required"}).waitFor();
  assert.equal(await page.getByText("new-organizer@example.invalid",{exact:true}).count(),0);
  state.failRegister=false;
  await page.getByRole("button",{name:"Register organizer",exact:true}).click();
  await page.getByRole("status").filter({hasText:"Organizer registered"}).waitFor();
  await page.getByText("new-organizer@example.invalid",{exact:true}).waitFor();
  assert.equal(await page.getByLabel("Initial password").inputValue(),"");
  for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:1000});assert.equal(await noOverflow(page),true);await page.screenshot({path:`.taste-skill/admin-management/users-${width}.png`,fullPage:true});}
  await page.goto(`${base}/admin`);
  await page.getByRole("button",{name:"Create event",exact:true}).click();
  await page.getByLabel("Publisher",{exact:true}).selectOption(management.id);
  await page.getByLabel("Event name",{exact:true}).fill("Fixture new admin event");
  await page.getByLabel("Description",{exact:true}).fill("Complete fixture details for administrator creation.");
  await page.getByLabel("Event poster",{exact:true}).setInputFiles({name:"fixture.jpg",mimeType:"image/jpeg",buffer:photo});
  await page.getByLabel("Start · Philippine time").fill("2027-01-01T09:00");await page.getByLabel("End · Philippine time").fill("2027-01-01T10:00");
  await page.getByLabel("Course",{exact:true}).selectOption("BSHM");
  const writes=calls.length;
  await page.getByRole("button",{name:"Next: preview event",exact:true}).click();
  await page.getByRole("region",{name:"Administrator event preview",exact:true}).waitFor();
  assert.equal(await page.locator(".admin-event-form").isVisible(),false);assert.equal(calls.length,writes);
  await page.getByRole("button",{name:"Back to details",exact:true}).click();
  assert.equal(await page.getByLabel("Event name",{exact:true}).inputValue(),"Fixture new admin event");
  assert.equal(await page.getByLabel("Event poster",{exact:true}).evaluate(element=>element.files.length),1);
  await page.getByRole("button",{name:"Next: preview event",exact:true}).click();
  for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.equal(await noOverflow(page),true);await page.screenshot({path:`.taste-skill/admin-management/preview-${width}.png`,fullPage:true});}
  await page.getByRole("button",{name:"Create pending event",exact:true}).click();
  await page.getByRole("status").filter({hasText:"Event created"}).waitFor();
  await page.waitForFunction(()=>document.activeElement?.id === "submissions-title");
  const created=calls.find(call=>call.type==="save");assert.equal(created.body.event_starts_at,"2027-01-01T01:00:00.000Z");assert.equal(created.body.expected_updated_at,null);assert.ok(created.body.poster_path.startsWith(adminId+"/"));
  await page.getByRole("button",{name:"Published",exact:true}).click();
  await page.getByRole("button",{name:"Edit event",exact:true}).click();
  assert.equal(await page.getByLabel("Publisher",{exact:true}).isDisabled(),true);
  await page.getByLabel("Event name",{exact:true}).fill("Fixture edited published event");
  await page.getByRole("button",{name:"Next: preview event",exact:true}).click();
  await page.getByRole("button",{name:"Save changes",exact:true}).click();
  await page.getByRole("status").filter({hasText:"Event changes saved"}).waitFor();
  assert.equal(rows.find(row=>row.title==="Fixture edited published event").status,"approved");assert.equal(rows.find(row=>row.title==="Fixture edited published event").created_by,ownerId);
  await page.getByRole("button",{name:"Published",exact:true}).click();
  // A definite rejection cleans only the new poster; an unknown result retains it.
  for(const failure of [{code:"P0001",message:"This event changed. Refresh before editing again",status:400},{code:"08006",message:"Connection lost",status:503}]) {
    await page.getByRole("button",{name:"Edit event",exact:true}).click();
    await page.getByLabel("Replace poster (optional)",{exact:true}).setInputFiles({name:"replacement.jpg",mimeType:"image/jpeg",buffer:photo});
    await page.getByRole("button",{name:"Next: preview event",exact:true}).click();
    const cleanups=calls.filter(call=>call.type==="cleanup").length;
    state.saveError=failure;
    await page.getByRole("button",{name:"Save changes",exact:true}).click();
    await page.getByRole("alert").filter({hasText:failure.message}).waitFor();
    assert.equal(calls.filter(call=>call.type==="cleanup").length,cleanups+(failure.status===400?1:0));
    assert.equal(rows.find(row=>row.status==="approved").image_path,`${ownerId}/approved.jpg`);
    await page.getByRole("button",{name:"Cancel",exact:true}).click();
    await page.waitForFunction(()=>document.activeElement?.id==="submissions-title");
  }
  const deletedBefore=calls.filter(call=>call.type==="delete").length;
  page.once("dialog",dialog=>dialog.dismiss());await page.getByRole("button",{name:"Delete event",exact:true}).click();assert.equal(calls.filter(call=>call.type==="delete").length,deletedBefore);
  page.once("dialog",dialog=>dialog.accept());await page.getByRole("button",{name:"Delete event",exact:true}).click();
  await page.getByRole("status").filter({hasText:"Event deleted"}).waitFor();assert.equal(rows.some(row=>row.title==="Fixture edited published event"),false);assert.equal(calls.at(-1).type,"cleanup");
  await page.waitForFunction(()=>document.activeElement?.id === "submissions-title");
  await page.getByRole("button",{name:"All",exact:true}).click();
  state.failCleanup=true;
  const createdRow=page.getByRole("row").filter({hasText:"Fixture new admin event"}).first();
  page.once("dialog",dialog=>dialog.accept());await createdRow.getByRole("button",{name:"Delete event",exact:true}).click();
  await page.getByRole("alert").filter({hasText:"unused poster could not be removed"}).waitFor();
  assert.equal(rows.some(row=>row.title==="Fixture new admin event"),false);
  assert.deepEqual(errors,[]);await context.close();
  const limited=await fixture("organizer");await limited.page.goto(`${base}/organizer`);await limited.page.getByRole("button",{name:"Create event",exact:true}).click();assert.equal(await limited.page.getByLabel("Course",{exact:true}).locator("option").count(),1);assert.equal(await limited.page.getByLabel("Course",{exact:true}).inputValue(),"BSHM");await limited.context.close();
  const member=await fixture("member");await member.page.goto(`${base}/admin/users`);await member.page.waitForURL(`${base}/account`);assert.equal(member.calls.length,0);await member.context.close();
  console.log("PASS administrator registration/failure, department courses, private preview/Back/file retention, creation, published edits, confirmed deletion/cleanup, mobile layout, scoped organizer course and member denial");
} catch(error) {
  for(const context of browser.contexts()) for(const page of context.pages()) {
    console.error("Browser fixture failure at",page.url(),(await page.locator("body").innerText()).slice(0,1400));
    await page.screenshot({path:".taste-skill/admin-management/failure.png",fullPage:true});
  }
  throw error;
} finally {await browser.close();}
