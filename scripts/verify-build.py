"""Check imported metadata and local references in a completed static build."""
import json,sys
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
base=sys.argv[1] if len(sys.argv)>1 else '/'
refs=set()
class Scan(HTMLParser):
 def handle_starttag(self,tag,attrs):
  for key,value in attrs:
   if not value:continue
   if key in ['href','src','poster']:refs.add(value)
   if key=='srcset':
    for part in value.split(','):refs.add(part.strip().split(' ')[0])
for f in Path('dist').rglob('*.html'):Scan().feed(f.read_text())
missing=[]
for value in refs:
 if not value.startswith('/') or value.startswith('//'):continue
 path=unquote(urlsplit(value).path)
 if not path.startswith(base):missing.append(value);continue
 p=Path('dist')/path[len(base):]
 if not p.is_file() and not (p/'index.html').is_file():missing.append(value)
assert not missing,missing
posts=json.loads(Path('src/data/posts.json').read_text())
selected=set(json.loads(Path('src/data/selected-ghost-projects.json').read_text()))
for p in posts:assert (Path('dist')/p['slug']/'index.html').exists(),p['slug']
if Path('.migration/export.json').exists():
 original=json.loads(Path('.migration/export.json').read_text())['db'][0]['data']
 project_tags={t['id'] for t in original['tags'] if t['slug']=='project-journal'}
 project_posts={r['post_id'] for r in original['posts_tags'] if r['tag_id'] in project_tags}
 expected={p['slug']:p for p in original['posts'] if p['status']=='published' and p['visibility']=='public' and p['type']=='post' and p['id'] in project_posts and p['slug'] in selected}
 excluded={p['slug'] for p in original['posts'] if p['type']=='post'}-set(expected)
 for slug in excluded:assert not (Path('dist')/slug/'index.html').exists(),slug
 assert set(expected)=={p['slug'] for p in posts}
 for p in posts:
  for key in ['title','published_at','updated_at','type']:assert p[key]==expected[p['slug']][key],(p['slug'],key)
  want={t['tag_id'] for t in original['posts_tags'] if t['post_id']==expected[p['slug']]['id']}
  tags={t['slug'] for t in original['tags'] if t['id'] in want}
  assert tags=={t['slug'] for t in p['tags']}
print(f'PASS: {len(posts)} original routes, dates, titles and tags; {len(refs)} HTML/media references; base {base}')
