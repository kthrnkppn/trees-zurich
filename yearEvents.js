// One notable world event per planting year that appears in the data. Compiled
// from general historical knowledge; the popup also links to the Wikipedia
// article for that year (German or English edition, matching the UI language) so
// readers can dig deeper. Bilingual ({de,en}); years without an entry show no
// event line.
export const yearEvents = {
  1665: {
    de: 'Grosse Pest in London; Newton legt die Grundlagen der Gravitationstheorie',
    en: 'Great Plague of London; Newton lays the foundations of the theory of gravity',
  },
  1780: {
    de: 'Tod von Kaiserin Maria Theresia',
    en: 'Death of Empress Maria Theresa',
  },
  1796: {
    de: 'Napoleons Italienfeldzug beginnt',
    en: "Napoleon's Italian campaign begins",
  },
  1800: {
    de: 'Alessandro Volta stellt die erste Batterie vor',
    en: 'Alessandro Volta unveils the first battery',
  },
  1805: {
    de: 'Seeschlacht von Trafalgar; Schlacht bei Austerlitz',
    en: 'Battle of Trafalgar; Battle of Austerlitz',
  },
  1806: {
    de: 'Ende des Heiligen Römischen Reiches',
    en: 'End of the Holy Roman Empire',
  },
  1815: {
    de: 'Napoleons Niederlage bei Waterloo; Wiener Kongress',
    en: "Napoleon's defeat at Waterloo; Congress of Vienna",
  },
  1820: {
    de: 'Erste Sichtung des antarktischen Kontinents',
    en: 'First sighting of the Antarctic continent',
  },
  1822: {
    de: 'Champollion entschlüsselt die ägyptischen Hieroglyphen',
    en: 'Champollion deciphers the Egyptian hieroglyphs',
  },
  1826: {
    de: 'Die älteste erhaltene Fotografie entsteht',
    en: 'The oldest surviving photograph is made',
  },
  1831: {
    de: 'Charles Darwin sticht mit der HMS Beagle in See',
    en: 'Charles Darwin sets sail on HMS Beagle',
  },
  1832: {
    de: 'Tod von Johann Wolfgang von Goethe',
    en: 'Death of Johann Wolfgang von Goethe',
  },
  1836: {
    de: 'Schlacht von Alamo in Texas',
    en: 'Battle of the Alamo in Texas',
  },
  1845: {
    de: 'Beginn der grossen Hungersnot in Irland',
    en: 'The Great Famine begins in Ireland',
  },
  1850: {
    de: 'Kalifornien wird US-Bundesstaat (Goldrausch)',
    en: 'California becomes a US state (Gold Rush)',
  },
  1852: {
    de: 'Napoleon III. begründet das Zweite Kaiserreich in Frankreich',
    en: 'Napoleon III founds the Second Empire in France',
  },
  1856: {
    de: 'Ende des Krimkriegs',
    en: 'End of the Crimean War',
  },
  1859: {
    de: 'Darwin veröffentlicht „Über die Entstehung der Arten"',
    en: 'Darwin publishes "On the Origin of Species"',
  },
  1860: {
    de: 'Abraham Lincoln wird zum US-Präsidenten gewählt',
    en: 'Abraham Lincoln is elected US President',
  },
  1864: {
    de: 'Gründung des Roten Kreuzes in Genf (Genfer Konvention)',
    en: 'Founding of the Red Cross in Geneva (Geneva Convention)',
  },
  1865: {
    de: 'Ende des Amerikanischen Bürgerkriegs; Lincoln wird ermordet',
    en: 'End of the American Civil War; Lincoln is assassinated',
  },
  1866: {
    de: 'Das erste dauerhafte Transatlantik-Telegrafenkabel wird verlegt',
    en: 'The first lasting transatlantic telegraph cable is laid',
  },
  1868: {
    de: 'Meiji-Restauration in Japan',
    en: 'Meiji Restoration in Japan',
  },
  1870: {
    de: 'Beginn des Deutsch-Französischen Krieges',
    en: 'The Franco-Prussian War begins',
  },
  1874: {
    de: 'Erste Impressionisten-Ausstellung in Paris',
    en: 'First Impressionist exhibition in Paris',
  },
  1875: {
    de: 'Die internationale Meterkonvention wird unterzeichnet',
    en: 'The international Metre Convention is signed',
  },
  1876: {
    de: 'Alexander Graham Bell meldet das Telefon zum Patent an',
    en: 'Alexander Graham Bell patents the telephone',
  },
  1880: {
    de: 'Vollendung des Kölner Doms',
    en: 'Cologne Cathedral is completed',
  },
  1882: {
    de: 'Robert Koch entdeckt den Tuberkulose-Erreger',
    en: 'Robert Koch discovers the tuberculosis bacterium',
  },
  1885: {
    de: 'Carl Benz baut das erste Automobil',
    en: 'Carl Benz builds the first automobile',
  },
  1886: {
    de: 'Die Freiheitsstatue wird in New York errichtet',
    en: 'The Statue of Liberty is erected in New York',
  },
  1888: {
    de: 'Kodak bringt die erste einfache Rollfilmkamera heraus',
    en: 'Kodak launches the first simple roll-film camera',
  },
  1889: {
    de: 'Der Eiffelturm wird zur Pariser Weltausstellung eröffnet',
    en: 'The Eiffel Tower opens for the Paris World Fair',
  },
  1890: {
    de: 'Tod von Vincent van Gogh',
    en: 'Death of Vincent van Gogh',
  },
  1895: {
    de: 'Die Brüder Lumière führen den ersten Film vor; Röntgen entdeckt die X-Strahlen',
    en: 'The Lumière brothers screen the first film; Röntgen discovers X-rays',
  },
  1896: {
    de: 'Erste Olympische Spiele der Neuzeit in Athen',
    en: 'First modern Olympic Games in Athens',
  },
  1897: {
    de: 'Erster Zionistenkongress in Basel',
    en: 'First Zionist Congress in Basel',
  },
  1900: {
    de: 'Max Planck begründet die Quantentheorie',
    en: 'Max Planck founds quantum theory',
  },
  1901: {
    de: 'Tod von Königin Victoria; erste Nobelpreise verliehen',
    en: 'Death of Queen Victoria; first Nobel Prizes awarded',
  },
  1902: {
    de: 'Verheerender Ausbruch des Vulkans Mont Pelé',
    en: 'Devastating eruption of Mount Pelée',
  },
  1904: {
    de: 'Beginn des Russisch-Japanischen Krieges',
    en: 'The Russo-Japanese War begins',
  },
  1905: {
    de: 'Einsteins „Wunderjahr" – u. a. die spezielle Relativitätstheorie',
    en: "Einstein's 'miracle year' – including special relativity",
  },
  1906: {
    de: 'Schweres Erdbeben zerstört San Francisco',
    en: 'A major earthquake destroys San Francisco',
  },
  1907: {
    de: 'Picasso malt „Les Demoiselles d’Avignon" – Beginn des Kubismus',
    en: "Picasso paints 'Les Demoiselles d'Avignon' – the birth of Cubism",
  },
  1908: {
    de: 'Tunguska-Ereignis in Sibirien; Ford bringt das Modell T heraus',
    en: 'Tunguska event in Siberia; Ford launches the Model T',
  },
  1910: {
    de: 'Beginn der Mexikanischen Revolution',
    en: 'The Mexican Revolution begins',
  },
  1911: {
    de: 'Roald Amundsen erreicht als Erster den Südpol',
    en: 'Roald Amundsen is the first to reach the South Pole',
  },
  1912: {
    de: 'Untergang der Titanic',
    en: 'The sinking of the Titanic',
  },
  1915: {
    de: 'Einstein vollendet die Allgemeine Relativitätstheorie',
    en: 'Einstein completes the general theory of relativity',
  },
  1916: {
    de: 'Schlachten von Verdun und an der Somme',
    en: 'Battles of Verdun and the Somme',
  },
  1917: {
    de: 'Oktoberrevolution in Russland; USA treten in den Krieg ein',
    en: 'October Revolution in Russia; the USA enters the war',
  },
  1918: {
    de: 'Ende des Ersten Weltkriegs; Beginn der Spanischen Grippe',
    en: 'End of the First World War; the Spanish flu begins',
  },
  1920: {
    de: 'Gründung des Völkerbunds mit Sitz in Genf',
    en: 'Founding of the League of Nations, seated in Geneva',
  },
  1921: {
    de: 'Einstein erhält den Physik-Nobelpreis',
    en: 'Einstein receives the Nobel Prize in Physics',
  },
  1922: {
    de: 'Entdeckung des Grabes von Tutanchamun; Gründung der Sowjetunion',
    en: "Discovery of Tutankhamun's tomb; founding of the Soviet Union",
  },
  1923: {
    de: 'Hyperinflation in Deutschland',
    en: 'Hyperinflation in Germany',
  },
  1924: {
    de: 'Tod von Lenin; erste Olympische Winterspiele in Chamonix',
    en: 'Death of Lenin; first Winter Olympics in Chamonix',
  },
  1925: {
    de: 'John Logie Baird führt erstmals das Fernsehen vor',
    en: 'John Logie Baird demonstrates television for the first time',
  },
  1926: {
    de: 'Deutschland tritt dem Völkerbund bei',
    en: 'Germany joins the League of Nations',
  },
  1928: {
    de: 'Alexander Fleming entdeckt das Penicillin',
    en: 'Alexander Fleming discovers penicillin',
  },
  1930: {
    de: 'Gandhis Salzmarsch; Entdeckung des Pluto',
    en: "Gandhi's Salt March; discovery of Pluto",
  },
  1931: {
    de: 'Eröffnung des Empire State Building',
    en: 'The Empire State Building opens',
  },
  1932: {
    de: 'Entdeckung des Neutrons',
    en: 'Discovery of the neutron',
  },
  1934: {
    de: 'Der „Lange Marsch" der chinesischen Kommunisten beginnt',
    en: "The Chinese Communists' Long March begins",
  },
  1935: {
    de: 'Persien wird offiziell in Iran umbenannt',
    en: 'Persia is officially renamed Iran',
  },
  1936: {
    de: 'Olympische Spiele in Berlin; Beginn des Spanischen Bürgerkriegs',
    en: 'Olympic Games in Berlin; the Spanish Civil War begins',
  },
  1937: {
    de: 'Hindenburg-Katastrophe; Picasso malt „Guernica"',
    en: "Hindenburg disaster; Picasso paints 'Guernica'",
  },
  1938: {
    de: 'Otto Hahn gelingt die Kernspaltung',
    en: 'Otto Hahn achieves nuclear fission',
  },
  1939: {
    de: 'Beginn des Zweiten Weltkriegs',
    en: 'The Second World War begins',
  },
  1940: {
    de: 'Luftschlacht um England',
    en: 'The Battle of Britain',
  },
  1941: {
    de: 'Angriff auf Pearl Harbor; USA treten in den Krieg ein',
    en: 'Attack on Pearl Harbor; the USA enters the war',
  },
  1942: {
    de: 'Erste kontrollierte nukleare Kettenreaktion (Enrico Fermi)',
    en: 'First controlled nuclear chain reaction (Enrico Fermi)',
  },
  1943: {
    de: 'Kriegswende bei Stalingrad',
    en: 'The turning point of the war at Stalingrad',
  },
  1944: {
    de: 'D-Day: Landung der Alliierten in der Normandie',
    en: 'D-Day: the Allied landings in Normandy',
  },
  1945: {
    de: 'Ende des Zweiten Weltkriegs; Atombomben auf Japan; Gründung der UNO',
    en: 'End of the Second World War; atomic bombs on Japan; founding of the UN',
  },
  1946: {
    de: 'Der erste programmierbare Grossrechner ENIAC wird vorgestellt',
    en: 'The first programmable mainframe, ENIAC, is unveiled',
  },
  1948: {
    de: 'Gründung des Staates Israel; Allgemeine Erklärung der Menschenrechte',
    en: 'Founding of the State of Israel; Universal Declaration of Human Rights',
  },
  1950: {
    de: 'Beginn des Koreakriegs',
    en: 'The Korean War begins',
  },
  1951: {
    de: 'Erste landesweite Farbfernseh-Sendung in den USA',
    en: 'First nationwide colour TV broadcast in the USA',
  },
  1952: {
    de: 'Elisabeth II. wird Königin; erste Wasserstoffbombe gezündet',
    en: 'Elizabeth II becomes queen; the first hydrogen bomb is detonated',
  },
  1953: {
    de: 'Aufklärung der DNA-Doppelhelix; Erstbesteigung des Mount Everest',
    en: 'The DNA double helix is described; first ascent of Mount Everest',
  },
  1954: {
    de: '„Wunder von Bern" – Deutschland wird Fussball-Weltmeister',
    en: "'Miracle of Bern' – West Germany win the football World Cup",
  },
  1955: {
    de: 'Tod von Albert Einstein',
    en: 'Death of Albert Einstein',
  },
  1956: {
    de: 'Suezkrise und Ungarn-Aufstand',
    en: 'Suez Crisis and Hungarian Uprising',
  },
  1957: {
    de: 'Sputnik 1 – Beginn des Weltraumzeitalters',
    en: 'Sputnik 1 – the dawn of the Space Age',
  },
  1958: {
    de: 'Gründung der NASA',
    en: 'Founding of NASA',
  },
  1959: {
    de: 'Sieg der Kubanischen Revolution',
    en: 'Victory of the Cuban Revolution',
  },
  1960: {
    de: '„Afrikanisches Jahr": 17 Staaten werden unabhängig',
    en: "'Year of Africa': 17 countries gain independence",
  },
  1961: {
    de: 'Juri Gagarin fliegt als erster Mensch ins All; Bau der Berliner Mauer',
    en: 'Yuri Gagarin becomes the first human in space; the Berlin Wall is built',
  },
  1962: {
    de: 'Kubakrise bringt die Welt an den Rand eines Atomkriegs',
    en: 'The Cuban Missile Crisis brings the world to the brink of nuclear war',
  },
  1963: {
    de: 'Ermordung von John F. Kennedy; Kings „I Have a Dream"',
    en: "Assassination of John F. Kennedy; King's 'I Have a Dream'",
  },
  1964: {
    de: 'Nelson Mandela wird zu lebenslanger Haft verurteilt',
    en: 'Nelson Mandela is sentenced to life imprisonment',
  },
  1965: {
    de: 'Erster Weltraumspaziergang',
    en: 'First spacewalk',
  },
  1966: {
    de: 'Beginn der Kulturrevolution in China',
    en: 'The Cultural Revolution begins in China',
  },
  1967: {
    de: 'Erste Herztransplantation durch Christiaan Barnard',
    en: 'First heart transplant, by Christiaan Barnard',
  },
  1968: {
    de: 'Prager Frühling und weltweite Proteste',
    en: 'The Prague Spring and worldwide protests',
  },
  1969: {
    de: 'Erste Mondlandung (Apollo 11); Woodstock-Festival',
    en: 'First Moon landing (Apollo 11); Woodstock festival',
  },
  1970: {
    de: 'Erster „Earth Day" – die Umweltbewegung erstarkt',
    en: "First Earth Day – the environmental movement gathers strength",
  },
  1971: {
    de: 'Gründung von Greenpeace',
    en: 'Founding of Greenpeace',
  },
  1972: {
    de: '„Pong" startet das Zeitalter der Videospiele',
    en: "'Pong' launches the age of video games",
  },
  1973: {
    de: 'Ölkrise erschüttert die Weltwirtschaft',
    en: 'The oil crisis shakes the world economy',
  },
  1974: {
    de: 'Rücktritt von US-Präsident Nixon (Watergate)',
    en: 'US President Nixon resigns (Watergate)',
  },
  1975: {
    de: 'Ende des Vietnamkriegs',
    en: 'End of the Vietnam War',
  },
  1976: {
    de: 'Apple wird gegründet',
    en: 'Apple is founded',
  },
  1977: {
    de: 'Start der Voyager-Raumsonden; Tod von Elvis Presley',
    en: 'Launch of the Voyager probes; death of Elvis Presley',
  },
  1978: {
    de: 'Geburt des ersten „Retortenbabys"',
    en: 'Birth of the first "test-tube baby"',
  },
  1979: {
    de: 'Islamische Revolution im Iran',
    en: 'The Islamic Revolution in Iran',
  },
  1980: {
    de: 'Die WHO erklärt die Pocken für ausgerottet',
    en: 'The WHO declares smallpox eradicated',
  },
  1981: {
    de: 'Erster Space-Shuttle-Flug; AIDS wird erstmals beschrieben',
    en: 'First Space Shuttle flight; AIDS is first described',
  },
  1982: {
    de: 'Die Audio-CD kommt auf den Markt',
    en: 'The audio CD comes to market',
  },
  1983: {
    de: 'Das Internet (TCP/IP) nimmt offiziell den Betrieb auf',
    en: 'The internet (TCP/IP) officially goes into operation',
  },
  1984: {
    de: 'Apple stellt den Macintosh vor',
    en: 'Apple unveils the Macintosh',
  },
  1985: {
    de: 'Das Ozonloch über der Antarktis wird entdeckt',
    en: 'The ozone hole over Antarctica is discovered',
  },
  1986: {
    de: 'Reaktorkatastrophe von Tschernobyl',
    en: 'The Chernobyl reactor disaster',
  },
  1987: {
    de: 'Montreal-Protokoll zum Schutz der Ozonschicht',
    en: 'Montreal Protocol to protect the ozone layer',
  },
  1988: {
    de: 'Ende des Iran-Irak-Kriegs',
    en: 'End of the Iran–Iraq War',
  },
  1989: {
    de: 'Fall der Berliner Mauer',
    en: 'Fall of the Berlin Wall',
  },
  1990: {
    de: 'Deutsche Wiedervereinigung; Freilassung von Nelson Mandela',
    en: 'German reunification; release of Nelson Mandela',
  },
  1991: {
    de: 'Ende der Sowjetunion; das World Wide Web wird öffentlich',
    en: 'End of the Soviet Union; the World Wide Web goes public',
  },
  1992: {
    de: 'Erdgipfel von Rio – Klimaschutz wird Weltthema',
    en: 'Rio Earth Summit – climate protection becomes a global issue',
  },
  1993: {
    de: 'Gründung der Europäischen Union',
    en: 'Founding of the European Union',
  },
  1994: {
    de: 'Ende der Apartheid – Mandela wird Präsident; Völkermord in Ruanda',
    en: 'End of apartheid – Mandela becomes president; genocide in Rwanda',
  },
  1995: {
    de: 'Erster Exoplanet entdeckt (Genfer Astronomen); Windows 95 erscheint',
    en: 'First exoplanet discovered (Geneva astronomers); Windows 95 is released',
  },
  1996: {
    de: 'Das Klonschaf „Dolly" wird geboren',
    en: 'Dolly the cloned sheep is born',
  },
  1997: {
    de: 'Tod von Prinzessin Diana; der erste „Harry Potter" erscheint',
    en: 'Death of Princess Diana; the first "Harry Potter" is published',
  },
  1998: {
    de: 'Google wird gegründet',
    en: 'Google is founded',
  },
  1999: {
    de: 'Der Euro wird als Buchgeld eingeführt',
    en: 'The euro is introduced as accounting currency',
  },
  2000: {
    de: 'Weltweite Jahrtausendwende (Y2K)',
    en: 'The worldwide millennium turn (Y2K)',
  },
  2001: {
    de: 'Terroranschläge des 11. September; Wikipedia geht online',
    en: 'The September 11 terror attacks; Wikipedia goes online',
  },
  2002: {
    de: 'Das Euro-Bargeld kommt in Umlauf',
    en: 'Euro banknotes and coins enter circulation',
  },
  2003: {
    de: 'Beginn des Irakkriegs; Columbia-Shuttle verunglückt',
    en: 'The Iraq War begins; the Space Shuttle Columbia is lost',
  },
  2004: {
    de: 'Tsunami im Indischen Ozean; Facebook startet',
    en: 'Indian Ocean tsunami; Facebook launches',
  },
  2005: {
    de: 'YouTube wird gegründet',
    en: 'YouTube is founded',
  },
  2006: {
    de: 'Pluto wird zum Zwergplaneten herabgestuft',
    en: 'Pluto is reclassified as a dwarf planet',
  },
  2007: {
    de: 'Apple stellt das erste iPhone vor',
    en: 'Apple unveils the first iPhone',
  },
  2008: {
    de: 'Globale Finanzkrise',
    en: 'The global financial crisis',
  },
  2009: {
    de: 'Barack Obama wird US-Präsident',
    en: 'Barack Obama becomes US President',
  },
  2010: {
    de: 'Ölkatastrophe „Deepwater Horizon" im Golf von Mexiko',
    en: 'The Deepwater Horizon oil disaster in the Gulf of Mexico',
  },
  2011: {
    de: 'Reaktorkatastrophe von Fukushima; Arabischer Frühling',
    en: 'The Fukushima reactor disaster; the Arab Spring',
  },
  2012: {
    de: 'Nachweis des Higgs-Bosons am CERN bei Genf',
    en: 'The Higgs boson is detected at CERN near Geneva',
  },
  2013: {
    de: 'Wahl von Papst Franziskus',
    en: 'Election of Pope Francis',
  },
  2014: {
    de: 'Russland annektiert die Krim',
    en: 'Russia annexes Crimea',
  },
  2015: {
    de: 'Pariser Klimaabkommen; europäische Flüchtlingskrise',
    en: 'The Paris climate agreement; the European refugee crisis',
  },
  2016: {
    de: 'Brexit-Referendum; Wahl von Donald Trump',
    en: 'The Brexit referendum; election of Donald Trump',
  },
  2017: {
    de: 'Die #MeToo-Bewegung breitet sich weltweit aus',
    en: 'The #MeToo movement spreads worldwide',
  },
  2018: {
    de: 'Greta Thunberg startet den Klima-Schulstreik',
    en: 'Greta Thunberg starts the school climate strike',
  },
  2019: {
    de: 'Erstes Foto eines Schwarzen Lochs',
    en: 'First-ever photo of a black hole',
  },
  2020: {
    de: 'Beginn der COVID-19-Pandemie',
    en: 'The COVID-19 pandemic begins',
  },
  2021: {
    de: 'Sturm aufs US-Kapitol; erster Helikopterflug auf dem Mars',
    en: 'Storming of the US Capitol; first helicopter flight on Mars',
  },
  2022: {
    de: 'Russischer Angriff auf die Ukraine; erste Bilder des James-Webb-Teleskops',
    en: 'Russian invasion of Ukraine; first images from the James Webb telescope',
  },
  2023: {
    de: 'ChatGPT löst den weltweiten KI-Boom aus',
    en: 'ChatGPT sparks the worldwide AI boom',
  },
  2024: {
    de: 'Olympische Sommerspiele in Paris',
    en: 'Summer Olympic Games in Paris',
  },
  2025: {
    de: 'Einer der jüngsten Bäume im Baumkataster',
    en: 'One of the youngest trees in the tree cadastre',
  },
  2026: {
    de: 'Frisch gepflanzt – einer von Zürichs neuesten Stadtbäumen',
    en: "Freshly planted – one of Zurich's newest city trees",
  },
};
