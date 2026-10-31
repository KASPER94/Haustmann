"""Plan schématique des 20 arrondissements de Paris, dessiné à la main (pas de données cadastrales).

Chaque arrondissement est un polygone qui passe par des points nommés (portes, places, ponts),
placés de mémoire à environ 100 m près. Les frontières partagées passent par les mêmes points :
pas de trou ni de chevauchement. La Seine est la frontière entre rive droite et rive gauche.

Le centre est grossi (effet loupe) pour que les petits arrondissements du centre restent assez
grands pour le doigt, et les bois sont resserrés.

Le site lit le résultat dans src/lib/paris-plan.json (composant ParisPlan.astro).

Usage, depuis la racine du dépôt : python3 -E tools/paris-plan.py src/lib/paris-plan.json
"""
import json
import math
import sys

# (latitude, longitude)
P = {
    # Limite de la ville, dans le sens des aiguilles d'une montre depuis la porte Maillot
    "MAILLOT": (48.8780, 2.2830), "CHAMPERRET": (48.8857, 2.2925), "ASNIERES": (48.8895, 2.3020),
    "CLICHYP": (48.8945, 2.3133), "STOUENP": (48.8975, 2.3290), "CLIGNANCOURT": (48.8985, 2.3446),
    "CHAPELLEP": (48.8990, 2.3590), "AUBERVP": (48.8990, 2.3700), "VILLETTEP": (48.8975, 2.3860),
    "PANTINP": (48.8885, 2.3925), "PRESG": (48.8800, 2.3990), "LILASP": (48.8770, 2.4065),
    "BAGNOLETP": (48.8640, 2.4090), "MONTREUILP": (48.8535, 2.4105), "VINCENNESP": (48.8470, 2.4105),
    "STMANDEP": (48.8440, 2.4125), "DOREE": (48.8355, 2.4060), "CHARENTONP": (48.8320, 2.3995),
    "IVRYP": (48.8215, 2.3695), "ITALIEP": (48.8190, 2.3595), "GENTILLYP": (48.8160, 2.3440),
    "CITEU": (48.8195, 2.3385), "ORLEANSP": (48.8232, 2.3255), "CHATILLONP": (48.8238, 2.3165),
    "VANVESP": (48.8270, 2.3058), "PLAINEP": (48.8310, 2.2930), "SEVRESP": (48.8350, 2.2795),
    "STCLOUDP": (48.8378, 2.2570), "AUTEUILP": (48.8470, 2.2560), "MUETTEP": (48.8600, 2.2690),
    "DAUPHINEP": (48.8715, 2.2765),
    # Rive droite
    "ETOILE": (48.8738, 2.2950), "TERNES": (48.8783, 2.2985), "VILLIERS": (48.8810, 2.3155),
    "CLICHY": (48.8835, 2.3275), "PIGALLE": (48.8820, 2.3375), "BARBES": (48.8835, 2.3495),
    "STALINGRAD": (48.8843, 2.3665), "COLFABIEN": (48.8778, 2.3705), "BELLEVILLE": (48.8720, 2.3770),
    "RUEBELLEVILLE": (48.8750, 2.3890), "MENIL": (48.8665, 2.3830), "PLACHAISE": (48.8625, 2.3870),
    "PHAUGUSTE": (48.8580, 2.3905), "NATION": (48.8485, 2.3958), "FBGSTANTOINE": (48.8505, 2.3830),
    "BASTILLE": (48.8532, 2.3692), "REPUBLIQUE": (48.8675, 2.3635), "VOSGES": (48.8565, 2.3678),
    "RAMBUTEAU": (48.8615, 2.3505), "ETIENNEMARCEL": (48.8641, 2.3513), "STDENIS": (48.8698, 2.3535),
    "BONNENOUVELLE": (48.8709, 2.3485), "MONTMARTRE": (48.8725, 2.3400), "MADELEINE": (48.8700, 2.3265),
    "PALAISROYAL": (48.8664, 2.3330), "PETITSCHAMPS": (48.8644, 2.3440), "STLAZARE": (48.8770, 2.3265),
    # Rive gauche
    "PORTROYAL": (48.8400, 2.3370), "SANTE": (48.8385, 2.3425), "GOBELINS": (48.8370, 2.3500),
    "STMARCEL": (48.8390, 2.3580), "SANTESUD": (48.8270, 2.3420), "MONTPARNASSE": (48.8430, 2.3240),
    "RAIL": (48.8350, 2.3150), "DUROC": (48.8470, 2.3165), "SEVRESBAB": (48.8512, 2.3265),
    "SUFFREN1": (48.8495, 2.3030), "SUFFREN2": (48.8465, 2.3090),
    # Seine, d'amont en aval (ligne médiane)
    "S_IN": (48.8255, 2.3900), "S_TOLBIAC": (48.8345, 2.3795), "S_BERCY": (48.8385, 2.3745),
    "S_AUSTERLITZ": (48.8450, 2.3660), "S_SULLY": (48.8490, 2.3605), "S_LOUIS": (48.8525, 2.3545),
    "S_MICHEL": (48.8558, 2.3450), "S_NEUF": (48.8580, 2.3400), "S_CARROUSEL": (48.8598, 2.3325),
    "S_ROYAL": (48.8610, 2.3285), "S_CONCORDE": (48.8637, 2.3200), "S_ALEXANDRE": (48.8642, 2.3135),
    "S_ALMA": (48.8638, 2.3015), "S_IENA": (48.8600, 2.2935), "S_BIRHAKEIM": (48.8560, 2.2880),
    "S_GRENELLE": (48.8490, 2.2810), "S_GARIGLIANO": (48.8410, 2.2705), "S_OUT": (48.8370, 2.2655),
}
SEINE = ["S_IN", "S_TOLBIAC", "S_BERCY", "S_AUSTERLITZ", "S_SULLY", "S_LOUIS", "S_MICHEL", "S_NEUF",
         "S_CARROUSEL", "S_ROYAL", "S_CONCORDE", "S_ALEXANDRE", "S_ALMA", "S_IENA", "S_BIRHAKEIM",
         "S_GRENELLE", "S_GARIGLIANO", "S_OUT"]


def seine(a, b):
    """Les points de la Seine de a à b, dans un sens ou dans l'autre (a et b compris)."""
    i, j = SEINE.index(a), SEINE.index(b)
    return SEINE[i:j + 1] if i <= j else SEINE[j:i + 1][::-1]


def ring(*parts):
    out = []
    for p in parts:
        for n in ([p] if isinstance(p, str) else p):
            if not out or out[-1] != n:
                out.append(n)
    return out


ARR = {
    1: ring(seine("S_MICHEL", "S_CONCORDE"), "MADELEINE", "PALAISROYAL", "PETITSCHAMPS", "ETIENNEMARCEL", "RAMBUTEAU"),
    2: ring("MADELEINE", "MONTMARTRE", "BONNENOUVELLE", "STDENIS", "ETIENNEMARCEL", "PETITSCHAMPS", "PALAISROYAL"),
    3: ring("STDENIS", "REPUBLIQUE", "VOSGES", "RAMBUTEAU", "ETIENNEMARCEL"),
    4: ring("RAMBUTEAU", "VOSGES", "BASTILLE", seine("S_AUSTERLITZ", "S_MICHEL")),
    5: ring(seine("S_MICHEL", "S_AUSTERLITZ"), "STMARCEL", "GOBELINS", "SANTE", "PORTROYAL"),
    6: ring(seine("S_CARROUSEL", "S_MICHEL"), "PORTROYAL", "MONTPARNASSE", "DUROC", "SEVRESBAB"),
    7: ring(seine("S_BIRHAKEIM", "S_CARROUSEL"), "SEVRESBAB", "DUROC", "SUFFREN2", "SUFFREN1"),
    8: ring(seine("S_CONCORDE", "S_ALMA"), "ETOILE", "TERNES", "VILLIERS", "CLICHY", "STLAZARE", "MADELEINE"),
    9: ring("MADELEINE", "STLAZARE", "CLICHY", "PIGALLE", "BARBES", "BONNENOUVELLE", "MONTMARTRE"),
    10: ring("BONNENOUVELLE", "BARBES", "STALINGRAD", "COLFABIEN", "BELLEVILLE", "REPUBLIQUE", "STDENIS"),
    11: ring("REPUBLIQUE", "BELLEVILLE", "MENIL", "PLACHAISE", "PHAUGUSTE", "NATION", "FBGSTANTOINE", "BASTILLE", "VOSGES"),
    12: ring("BASTILLE", "FBGSTANTOINE", "NATION", "VINCENNESP", "STMANDEP", "DOREE", "CHARENTONP", seine("S_IN", "S_AUSTERLITZ")),
    13: ring(seine("S_AUSTERLITZ", "S_IN"), "IVRYP", "ITALIEP", "GENTILLYP", "SANTESUD", "SANTE", "GOBELINS", "STMARCEL"),
    14: ring("SANTE", "SANTESUD", "GENTILLYP", "CITEU", "ORLEANSP", "CHATILLONP", "VANVESP", "RAIL", "MONTPARNASSE", "PORTROYAL"),
    15: ring("S_BIRHAKEIM", "SUFFREN1", "SUFFREN2", "DUROC", "MONTPARNASSE", "RAIL", "VANVESP", "PLAINEP", "SEVRESP", seine("S_OUT", "S_BIRHAKEIM")),
    16: ring(seine("S_ALMA", "S_OUT"), "STCLOUDP", "AUTEUILP", "MUETTEP", "DAUPHINEP", "MAILLOT", "ETOILE"),
    17: ring("ETOILE", "MAILLOT", "CHAMPERRET", "ASNIERES", "CLICHYP", "STOUENP", "CLICHY", "VILLIERS", "TERNES"),
    18: ring("CLICHY", "STOUENP", "CLIGNANCOURT", "CHAPELLEP", "AUBERVP", "STALINGRAD", "BARBES", "PIGALLE"),
    19: ring("STALINGRAD", "AUBERVP", "VILLETTEP", "PANTINP", "PRESG", "LILASP", "RUEBELLEVILLE", "BELLEVILLE", "COLFABIEN"),
    20: ring("BELLEVILLE", "RUEBELLEVILLE", "LILASP", "BAGNOLETP", "MONTREUILP", "VINCENNESP", "NATION", "PHAUGUSTE", "PLACHAISE", "MENIL"),
}

# Les bois, rattachés au 16e et au 12e
BOIS = {
    16: [P["MAILLOT"], (48.8800, 2.2620), (48.8770, 2.2470), (48.8700, 2.2330), (48.8600, 2.2265),
         (48.8500, 2.2330), (48.8445, 2.2440), P["AUTEUILP"], P["MUETTEP"], P["DAUPHINEP"]],
    12: [P["DOREE"], P["STMANDEP"], (48.8455, 2.4380), (48.8435, 2.4600), (48.8370, 2.4700),
         (48.8275, 2.4670), (48.8215, 2.4480), (48.8245, 2.4180), (48.8300, 2.4070)],
}
# Îles, en décor dans la Seine : (début, fin) en position le long de la Seine (indice du point + fraction)
ILES = {"cite": (SEINE.index("S_MICHEL") - 0.92, SEINE.index("S_MICHEL") + 0.72),
        "louis": (SEINE.index("S_LOUIS") - 0.12, SEINE.index("S_LOUIS") + 0.62)}
# Limite extérieure (le « mur ») : la ville sans les bois
OUTER = ["MAILLOT", "CHAMPERRET", "ASNIERES", "CLICHYP", "STOUENP", "CLIGNANCOURT", "CHAPELLEP", "AUBERVP",
         "VILLETTEP", "PANTINP", "PRESG", "LILASP", "BAGNOLETP", "MONTREUILP", "VINCENNESP", "STMANDEP", "DOREE",
         "CHARENTONP", "S_IN", "IVRYP", "ITALIEP", "GENTILLYP", "CITEU", "ORLEANSP", "CHATILLONP", "VANVESP",
         "PLAINEP", "SEVRESP", "S_OUT", "STCLOUDP", "AUTEUILP", "MUETTEP", "DAUPHINEP"]

C = (48.8585, 2.3480)  # centre de la loupe, vers le Châtelet
KX, KY = 73.27, 111.2  # km par degré à cette latitude


def km(ll):
    return ((ll[1] - C[1]) * KX, (C[0] - ll[0]) * KY)


def loupe(xy, k, R):
    x, y = xy
    r = math.hypot(x, y)
    if r == 0:
        return (0.0, 0.0)
    f = (1 + k) / (1 + k * r / R)
    return (x * f, y * f)


def edge_r(xy, outer):
    """Distance du centre au bord de la ville dans la direction de xy."""
    ang = math.atan2(xy[1], xy[0]); dx, dy = math.cos(ang), math.sin(ang)
    best = None
    for (ax, ay), (bx, by) in zip(outer, outer[1:] + outer[:1]):
        ex, ey = bx - ax, by - ay
        den = dx * ey - dy * ex
        if abs(den) < 1e-12:
            continue
        t = (ax * ey - ay * ex) / den
        u = (ax * dy - ay * dx) / den
        if t > 0 and 0 <= u <= 1:
            best = t if best is None else min(best, t)
    return best


def squeeze(xy, outer, f):
    """Rapproche du bord de la ville un point situé au-delà (les bois)."""
    r = math.hypot(*xy); e = edge_r(xy, outer)
    if e is None or r <= e:
        return xy
    r2 = e + (r - e) * f
    return (xy[0] * r2 / r, xy[1] * r2 / r)


def build(k=1.0, R=6.0, width=400.0, pad=6.0, bois_f=0.5):
    outer_km = [km(P[n]) for n in OUTER]
    pts = {n: loupe(km(ll), k, R) for n, ll in P.items()}
    bois = {a: [loupe(squeeze(km(ll), outer_km, bois_f), k, R) for ll in pl] for a, pl in BOIS.items()}
    sl = [pts[n] for n in SEINE]

    def along(t):
        i = min(int(t), len(sl) - 2); f = t - i
        (ax, ay), (bx, by) = sl[i], sl[i + 1]
        return (ax + (bx - ax) * f, ay + (by - ay) * f)

    def lens(a, b, n=14, w=None):
        c = [along(a + (b - a) * j / n) for j in range(n + 1)]
        left, right = [], []
        for j, (x, y) in enumerate(c):
            px, py = c[max(j - 1, 0)]; nx, ny = c[min(j + 1, n)]
            tx, ty = nx - px, ny - py; L = math.hypot(tx, ty) or 1
            h = w * math.sin(math.pi * j / n) ** 0.6
            left.append((x - ty / L * h, y + tx / L * h)); right.append((x + ty / L * h, y - tx / L * h))
        return left + right[::-1]

    allp = list(pts.values()) + [p for pl in bois.values() for p in pl]
    x0 = min(p[0] for p in allp); x1 = max(p[0] for p in allp)
    y0 = min(p[1] for p in allp); y1 = max(p[1] for p in allp)
    s = (width - 2 * pad) / (x1 - x0)

    def T(p):
        return (round((p[0] - x0) * s + pad, 1), round((p[1] - y0) * s + pad, 1))

    def d(pl, close=True):
        q = [T(p) for p in pl]
        return "M" + " L".join(f"{a:g} {b:g}" for a, b in q) + (" Z" if close else "")

    def centroid(pl):
        q = [T(p) for p in pl]
        a = cx = cy = 0.0
        for (x1_, y1_), (x2_, y2_) in zip(q, q[1:] + q[:1]):
            c = x1_ * y2_ - x2_ * y1_
            a += c; cx += (x1_ + x2_) * c; cy += (y1_ + y2_) * c
        a /= 2
        return (round(cx / (6 * a), 1), round(cy / (6 * a), 1), abs(a))

    out = {"viewBox": [0, 0, round(width), round((y1 - y0) * s + 2 * pad)], "arr": {}, "bois": {}, "iles": {}}
    for n, r in ARR.items():
        pl = [pts[x] for x in r]
        cx, cy, area = centroid(pl)
        xs = [T(p)[0] for p in pl]; ys = [T(p)[1] for p in pl]
        out["arr"][n] = {"d": d(pl), "c": [cx, cy], "area": round(area), "w": round(max(xs) - min(xs)), "h": round(max(ys) - min(ys))}
    for n, pl in bois.items():
        cx, cy, _ = centroid(pl)
        out["bois"][n] = {"d": d(pl), "c": [cx, cy]}
    hw = 2.6 / s  # demi-largeur des îles : un peu moins que le lit de la Seine dessiné
    for n, (a, b) in ILES.items():
        out["iles"][n] = d(lens(a, b, w=hw))
    city = [T(pts[n]) for n in OUTER]
    out["city"] = [min(p[0] for p in city), min(p[1] for p in city), max(p[0] for p in city), max(p[1] for p in city)]
    out["seine"] = d([pts[n] for n in SEINE], close=False)
    out["outer"] = d([pts[n] for n in OUTER])
    return out


if __name__ == "__main__":
    k = float(sys.argv[2]) if len(sys.argv) > 2 else 0.75
    R = float(sys.argv[3]) if len(sys.argv) > 3 else 8.0
    g = build(k, R)
    open(sys.argv[1], "w").write(json.dumps(g))
    print("viewBox", g["viewBox"], "ville", g["city"])
    for n, a in g["arr"].items():
        print(n, "w", a["w"], "h", a["h"], "aire", a["area"])
