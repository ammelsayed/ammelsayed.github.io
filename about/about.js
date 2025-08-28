/*---------------------------------------*\
    AUTHOR: A.M.M. Elsayed   
    * ALL RIGHTS RESERVED *
\*---------------------------------------*/


document.addEventListener("DOMContentLoaded", () => {
  const JSON_PATH = "about.json";

  const esc = s => (s == null ? "" : String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
  const attr = s => esc(s).replace(/"/g, "&quot;");

  // ---------- Profile builder ----------
  function buildProfileHtml(profile = {}) {
    const description = profile.description || "";

    const researchHtml = (profile.research_interests || [])
      .map(i => `• ${esc(i)}<br>`)
      .join("");

    const disciplines = (profile.disciplines || []).map(esc).join(" - ");

    const langs = profile.languages || [];
    const native = [];
    const working = [];
    langs.forEach(l => {
      if (/working/i.test(l)) working.push(esc(l.replace(/\(.*?\)/g, "").trim()));
      else native.push(esc(l));
    });
    const languagesSentence = native.length
      ? `Elsayed is native in ${native.join(", ")}${working.length ? ", with a working knowledge of " + working.join(", ") : "" }. His diverse language skills complement his international research collaborations and enhance his ability to engage with global scientific communities.`
      : esc(langs.join(", "));

    const linksHtml = (profile.links || []).map(link => {
      const url = attr(link.url || "#");
      const icon = attr(link.icon || "");
      return `<a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${icon}" style="display:inline-block; width:30px; height:30px; padding-left:5px; padding-right:20px;"></a>`;
    }).join("");

    return `
            <p>
            ${description}<br><br>
            <b>Research Interests:</b><br> ${researchHtml}<br>
            <b>Disciplines</b>: ${disciplines}.<br><br>
            <b>Languages:</b> ${languagesSentence}<br><br>${linksHtml}</p>`;
  }

  // ---------- Education builder ----------
  function buildEducationHtml(entries = []) {
    return entries.map(e => `
<li>
<img src="${attr(e.logo)}">
<dev>
<strong>${esc(e.date)}</strong><br>
${esc(e.degree)},<br>
<a href="${attr(e.institution_url)}">${esc(e.institution)}</a>, ${esc(e.location)}.<br>
${(e.research_focus || "").replace(/\n/g, "<br>")}
</dev>
</li>
`).join("\n");
  }

  // ---------- Work Experience builder ----------
  function buildWorkHtml(entries = []) {
    return entries.map(e => `
<li>
<img src="${attr(e.logo)}">
<dev>
<strong>${esc(e.date)}</strong><br>
${esc(e.role)},<br>
<a href="${attr(e.company_url)}">${esc(e.company)}</a>, ${esc(e.location)}.<br>
${(e.description || "").replace(/\n/g, "<br>")}
</dev>
</li>
`).join("\n");
  }

  // ---------- Programming Skills builder ----------
  function buildProgrammingHtml(skills = {}) {
    const order = ["Operating Systems", "Data Analysis", "Graphics Languages", "Web Development", "Database Management", "Typesetting"];
    const rows = order.map(category => {
      const items = skills[category] || [];
      if (!items.length) return "";

      const titleSpam = category.split(" ").map(w => `<spam>${esc(w)}</spam>`).join("\n");
      const cells = items.map(item => `<td class="CATEGORY-CONTENT"><img class="PROG-logo" src="${attr(item.logo)}">\n${item.name.toLowerCase() === "latex" ? "LaTeX" : esc(item.name)}</td>`).join("\n");

      return `<tr class="PROG-LANG-CATEGORY">
<td class="CATEGORY-TITLE">${titleSpam}</td>
${cells}
</tr>`;
    }).join("\n");

    return `<table class="PROG-LANG-TABLE"><tbody>${rows}</tbody></table>`;
  }

  // ---------- Main: fetch JSON and render ----------
  (async () => {
    let data;
    try {
      const res = await fetch(JSON_PATH, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch ${JSON_PATH}: ${res.status}`);
      data = await res.json();
    } catch (err) {
      console.error("about.js: could not load JSON:", err);
      ["profile", "education", "work-experience", "skills"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<div style="color:darkred;padding:12px;">Unable to load ${id.replace("-", " ")}.</div>`;
      });
      return;
    }

    // Render sections
    const profileTarget = document.getElementById("profile");
    if (profileTarget) profileTarget.innerHTML = data.profile?.full_html || buildProfileHtml(data.profile || {});

    const eduTarget = document.getElementById("education");
    if (eduTarget) eduTarget.innerHTML = buildEducationHtml(data.education || []);

    const workTarget = document.getElementById("work-experience");
    if (workTarget) workTarget.innerHTML = buildWorkHtml(data.work_experience || []);

    const skillsTarget = document.getElementById("skills");
    if (skillsTarget) skillsTarget.innerHTML = buildProgrammingHtml(data.programming_skills || {});
  })();
});
