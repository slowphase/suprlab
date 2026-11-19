"""Import a Ghost export without exposing drafts, members or account settings."""
import json,re,sys,html,urllib.request,concurrent.futures
from pathlib import Path
from urllib.parse import urlsplit,unquote
source=Path(sys.argv[1] if len(sys.argv)>1 else '.migration/export.json')
data=json.loads(source.read_text())['db'][0]['data']
selected=set(json.loads(Path('src/data/selected-ghost-projects.json').read_text()))
project_tags={t['id'] for t in data['tags'] if t['slug']=='project-journal'}
project_posts={r['post_id'] for r in data['posts_tags'] if r['tag_id'] in project_tags}
posts=[p for p in data['posts'] if p['status']=='published' and p['visibility']=='public' and p['type']=='post' and p['id'] in project_posts and p['slug'] in selected]
tags={t['id']:{'name':t['name'],'slug':t['slug'],'description':t.get('description') or ''} for t in data['tags']}
media=set()
for p in posts:
 for value in [p.get('html') or '',p.get('feature_image') or '']:
  media.update(re.findall(r'(?:__GHOST_URL__|https?://(?:www\.)?suprlab\.net)(/content/[^\s"<>\)]+)',html.unescape(value)))
failures=[]
def fetch(path):
 path=path.rstrip("',;")
 dest=Path('public'+unquote(urlsplit(path).path))
 if '..' in dest.parts:return
 dest.parent.mkdir(parents=True,exist_ok=True)
 try:
  if not dest.exists():
   req=urllib.request.Request('https://suprlab.net'+path,headers={'User-Agent':'suprlab migration'})
   with urllib.request.urlopen(req,timeout=45) as r: dest.write_bytes(r.read())
 except Exception as e: failures.append({'path':path,'error':str(e)})
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(fetch,media))
result=[]
for p in posts:
 body=p['html'] or ''
 body=body.replace('__GHOST_URL__','').replace('https://suprlab.net/','/').replace('http://suprlab.net/','/')
 body=re.sub(r'<script\b[^>]*>.*?</script>','',body,flags=re.S|re.I)
 body=re.sub(r'\s+on\w+\s*=\s*(?:"[^"]*"|\x27[^\x27]*\x27)','',body,flags=re.I)
 text=html.unescape(re.sub('<[^>]+>',' ',body))
 pt=[tags[t['tag_id']] for t in data['posts_tags'] if t['post_id']==p['id']]
 result.append({'slug':p['slug'],'title':p['title'],'type':p['type'],'published_at':p['published_at'],'updated_at':p['updated_at'],'html':body,'excerpt':p.get('custom_excerpt') or re.sub(r'\s+',' ',text).strip()[:210],'image':(p.get('feature_image') or '').replace('__GHOST_URL__','').replace('https://suprlab.net',''),'image_alt':p.get('feature_image_alt') or p['title'],'tags':pt})
result.sort(key=lambda p:p['published_at'],reverse=True)
Path('src/data/posts.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
report={'published_posts':sum(p['type']=='post' for p in result),'published_pages':sum(p['type']=='page' for p in result),'drafts_excluded':sum(p['status']=='draft' for p in data['posts']),'tags':list(tags.values()),'media_references':len(media),'media_failures':failures,'original_paths':['/'+p['slug']+'/' for p in result]}
Path('.migration/report.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:v for k,v in report.items() if k not in ['original_paths','tags']},indent=2))
