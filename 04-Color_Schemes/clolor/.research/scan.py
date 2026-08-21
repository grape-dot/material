import re, glob, os
os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/chunks")
for f in sorted(glob.glob("*.js")):
    s = open(f, encoding="utf-8", errors="ignore").read()
    if "ix3" in s and "register(" in s:
        ids = re.findall(r'\{id:"(i-[0-9a-f]+)"', s)
        props = set(re.findall(r'"wf:([a-z][\w-]*)"', s))
        trig = set(re.findall(r'"(wf:(?:scroll|click|hover|load|timer|page-load)[\w-]*)"', s))
        print(f, "| interactions:", len(ids), "| props:", sorted(props), "| triggers:", sorted(trig))
