import re, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
html = open("lattice.html", encoding="utf-8").read()
css = open("lattice.css", encoding="utf-8").read()

# collect all style content: external css + inline style blocks
inline = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", html, re.S))
allcss = css + "\n" + inline

# list all <section> and <header> tags in order
tags = re.findall(r"<(section|header|main|footer)[^>]*class=\"([^\"]*)\"[^>]*>", html)
print("=== SECTION ORDER ===")
seen = []
for tag, cls in tags:
    cls_clean = re.sub(r"w-variant-[0-9a-f-]+", "", cls).strip()
    seen.append((tag, cls_clean))
    print(f"{tag}: {cls_clean}")

print()
print("=== BACKGROUNDS PER CLASS ===")
for tag, cls_clean in seen:
    for cls in cls_clean.split():
        if not cls or cls.startswith("w-"):
            continue
        # find rules for .cls or .cls.modifiers
        for m in re.finditer(r"([\w.\-:#\s>+~\[\]='\"]*\." + re.escape(cls) + r"[\w.\-:#\s>+~\[\]='\"]*)\{([^}]*)\}", allcss):
            body = m.group(2)
            bg = re.findall(r"background[^;]*;", body)
            if bg:
                print(f"{cls_clean}  <-  {m.group(1).strip()[:90]}  ::  {' '.join(bg)[:160]}")
