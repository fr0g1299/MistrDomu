import {
  BookOpen,
  Bot,
  CheckSquare,
  FileCheck,
  HelpingHand,
  Info,
  MessageCircleQuestionMark,
  PhoneCall,
  UserPlus,
} from "lucide-react";
import { ReactNode } from "react";

export type FlowItem = {
  icon: typeof BookOpen;
  title: string;
  description: ReactNode;
  points: ReactNode[];
  ctaLabel?: string;
  ctaTo?: string;
  anchorId?: string;
};

export const helpFlow: FlowItem[] = [
  {
    icon: MessageCircleQuestionMark,
    title: "Máte problém? My máme návod!",
    description: (
      <>
        Ve vyhledávání najdete řešení podle{" "}
        <strong className="font-semibold text-primary">názvu problému</strong>,
        i klíčových slov. U každého výsledku vidíte{" "}
        <strong className="font-semibold text-primary">krátký popis</strong>,
        odhad{" "}
        <strong className="font-semibold text-primary">
          časové náročnosti
        </strong>{" "}
        a <strong className="font-semibold text-primary">složitost</strong>,
        abyste si snadno vybrali návod podle svých schopností.
      </>
    ),
    points: [
      <>
        Hledání podle{" "}
        <strong className="font-semibold text-primary">názvu problému</strong> a
        <strong className="font-semibold text-primary"> klíčových slov</strong>.
      </>,
      <>
        <strong className="font-semibold text-primary">Krátký popis</strong>,
        <strong className="font-semibold text-primary">
          {" "}
          časová náročnost
        </strong>{" "}
        a<strong className="font-semibold text-primary"> složitost</strong> u
        každého výsledku.
      </>,
      <>
        Návody <strong className="font-semibold text-primary">vytvořené</strong>{" "}
        a
        <strong className="font-semibold text-primary"> testované lidmi</strong>
        .
      </>,
    ],
    ctaLabel: "Projít návody",
    ctaTo: "/search",
  },
  {
    icon: BookOpen,
    title: "Postupujte v návodu krok za krokem",
    description: (
      <>
        Každý návod má přehledný popis, postup krok za krokem a část s
        <strong className="font-semibold text-primary">
          {" "}
          potřebnými pomůckami
        </strong>
        . Některé pomůcky mají i odkazy na
        <strong className="font-semibold text-primary">
          {" "}
          e-shopy našich partnerů
        </strong>
        .
      </>
    ),
    points: [
      <>
        <strong className="font-semibold text-primary">Popis návodu</strong>{" "}
        přímo nahoře a
        <strong className="font-semibold text-primary"> jasný postup</strong>{" "}
        pod ním.
      </>,
      <>
        <strong className="font-semibold text-primary">Potřebné pomůcky</strong>{" "}
        a materiál pro konkrétní návod.
      </>,
      <>
        U části položek i odkazy na{" "}
        <strong className="font-semibold text-primary">e-shopy partnerů</strong>
        .
      </>,
      <>
        Průběh si označujete a{" "}
        <strong className="font-semibold text-primary">postup se ukládá</strong>
        .
      </>,
    ],
  },
  {
    icon: Bot,
    title: "Konzultace s AI k danému návodu",
    description: (
      <>
        AI je tu jako{" "}
        <strong className="font-semibold text-primary">
          pomocník pro pochopení návodu
        </strong>
        . Je navržené tak, aby se drželo jen obsahu otevřeného manuálu a
        <strong className="font-semibold text-primary"> nevymýšlelo si</strong>{" "}
        postupy mimo něj.
      </>
    ),
    points: [
      <>
        AI se drží jen{" "}
        <strong className="font-semibold text-primary">
          konkrétního návodu
        </strong>
        .
      </>,
      <>
        <strong className="font-semibold text-primary">Nevymýšlí si</strong>{" "}
        vlastní postupy mimo obsah manuálu.
      </>,
      <>
        <strong className="font-semibold text-primary">2 dotazy zdarma</strong>{" "}
        pro každý návod.
      </>,
      <>
        Za <strong className="font-semibold text-primary">100 Kč</strong>{" "}
        neomezená konzultace pro daný návod napořád.
      </>,
    ],
  },
  {
    icon: PhoneCall,
    anchorId: "volani-s-expertem",
    title: "Když AI nestačí, zavolejte online expertovi",
    description: (
      <>
        Pokud AI nepomůže, nebo ji nechcete odemykat, můžete se
        <strong className="font-semibold text-primary">
          {" "}
          ihned spojit s online expertem
        </strong>
        , pokud je zrovna dostupný.
      </>
    ),
    points: [
      <>
        <strong className="font-semibold text-primary">
          Rychlé spojení s člověkem
        </strong>
        , pokud je expert online.
      </>,
      <>
        Vhodné i pro uživatele, kteří si{" "}
        <strong className="font-semibold text-primary">
          AI nechtějí platit
        </strong>
        .
      </>,
      <>
        Vyřešení problému za poplatek{" "}
        <strong className="font-semibold text-primary">přímo s expertem</strong>
        .
      </>,
    ],
  },
  {
    icon: CheckSquare,
    title: "Hotovo!",
    description: (
      <>
        Po dokončení práce máte nejen ušetřené peníze za servis nebo řemeslníka,
        ale i
        <strong className="font-semibold text-primary">
          {" "}
          nové praktické zkušenosti
        </strong>
        , které využijete příště.
      </>
    ),
    points: [
      <>
        <strong className="font-semibold text-primary">Nové zkušenosti</strong>,
        které využijete příště.
      </>,
      <>
        Často i{" "}
        <strong className="font-semibold text-primary">
          výrazná úspora peněz
        </strong>{" "}
        oproti servisu.
      </>,
    ],
  },
];

export const expertFlow: FlowItem[] = [
  {
    icon: UserPlus,
    title: "Získejte zkušenosti i přivýdělek jako Expert na našem webu!",
    description: (
      <>
        Jste studentem řemeslných oborů nebo kutil, který chce pomáhat ostatním?
        <strong className="font-semibold text-primary"> Onboarding</strong> je
        vstupní bránou do světa expertů. Získáte{" "}
        <strong className="font-semibold text-primary">praxi</strong> na
        reálných problémech uživatelů a můžete si{" "}
        <strong className="font-semibold text-primary">přivydělat</strong> vedle
        školy i práce.
      </>
    ),
    points: [
      <>
        <strong className="font-semibold text-primary">Onboarding</strong> je
        vstupní bod do expertní role.
      </>,
      <>
        Ideální model při{" "}
        <strong className="font-semibold text-primary">škole</strong>, jako
        <strong className="font-semibold text-primary"> koníček</strong> i
        <strong className="font-semibold text-primary"> přivýdělek</strong>.
      </>,
      <>
        Sbíráte <strong className="font-semibold text-primary">praxi</strong> na
        reálných problémech uživatelů.
      </>,
    ],
    ctaLabel: "Přejít na onboarding",
    ctaTo: "/expert-onboarding",
  },
  {
    icon: FileCheck,
    title: "Personalizujte si, u kterých návodů pomáháte",
    description: (
      <>
        Své služby nabízíte jen u návodů, kterým opravdu rozumíte. Expert si
        může podle
        <strong className="font-semibold text-primary">
          {" "}
          vlastních znalostí
        </strong>{" "}
        personalizovat oblasti, kde chce být{" "}
        <strong className="font-semibold text-primary">dostupný</strong>.
      </>
    ),
    points: [
      <>
        Volíte si témata podle{" "}
        <strong className="font-semibold text-primary">
          vlastních znalostí
        </strong>{" "}
        a<strong className="font-semibold text-primary"> specializace</strong>.
      </>,
      <>
        Nabízíte pomoc jen tam, kde máte{" "}
        <strong className="font-semibold text-primary">jistotu</strong>.
      </>,
      <>
        Profil pomoci si průběžně{" "}
        <strong className="font-semibold text-primary">upravujete</strong> podle
        potřeby.
      </>,
    ],
  },
  {
    icon: HelpingHand,
    title: "Pomáhejte kdykoliv, kdy se to VÁM hodí",
    description: (
      <>
        Kdykoliv podle svých preferencí přepnete do{" "}
        <strong className="font-semibold text-primary">online</strong>
        (aktivního) režimu. V tu chvíli vás uživatelé vidí jako
        <strong className="font-semibold text-primary">
          {" "}
          dostupného experta
        </strong>{" "}
        pro okamžitou konzultaci.
      </>
    ),
    points: [
      <>
        <strong className="font-semibold text-primary">Online/offline</strong>{" "}
        přepínáte kdykoliv dle svých preferencí.
      </>,
      <>
        V aktivním režimu se zobrazujete jako
        <strong className="font-semibold text-primary"> dostupný expert</strong>
        .
      </>,
      <>
        Dostupnost snadno sladíte se{" "}
        <strong className="font-semibold text-primary">školou</strong>,
        <strong className="font-semibold text-primary"> prací</strong> i volným
        časem.
      </>,
    ],
  },
  {
    icon: Info,
    title: "Máte zájem? Více info získáte přímou komunikací!",
    description: (
      <>
        Pokud vás zajímají podrobnosti k{" "}
        <strong className="font-semibold text-primary">
          pracovním příležitostem
        </strong>
        , spolupráci nebo získávání{" "}
        <strong className="font-semibold text-primary">praxe</strong>, napište
        nám
        <strong className="font-semibold text-primary"> e-mail</strong>. Ozveme
        se s konkrétními možnostmi podle vašeho zaměření.
      </>
    ),
    points: [
      <>
        Podrobnosti o{" "}
        <strong className="font-semibold text-primary">spolupráci</strong> a
        <strong className="font-semibold text-primary"> praxi</strong> řešíme
        individuálně přes
        <strong className="font-semibold text-primary"> e-mail</strong>.
      </>,
      <>
        Snadno zjistíte aktuální možnosti podle vašich
        <strong className="font-semibold text-primary"> zkušeností</strong>.
      </>,
      <>
        Stačí napsat a dostanete další informace i
        <strong className="font-semibold text-primary">
          {" "}
          doporučený postup
        </strong>
        .
      </>,
    ],
  },
];
