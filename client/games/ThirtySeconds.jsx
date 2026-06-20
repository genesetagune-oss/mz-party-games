import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../src/App.css";

const WIN_SCORE        = 30;
const CARD_SIZE        = 4;
const ROUND_SECONDS    = 30;
const READY_SECONDS    = 3;
const SWAPS_PER_ROUND  = 2;
const TRANSITION_SECONDS = 6;
const MAX_NAMES        = 6;


export const ITEMS_GLOBAL = [
  // MÚSICOS & BANDAS
  "Michael Jackson","Elvis Presley","Madonna","Bob Marley","Freddie Mercury","Prince","Whitney Houston","Aretha Franklin","James Brown","Ray Charles",
  "Frank Sinatra","Tina Turner","Diana Ross","Stevie Wonder","Elton John","David Bowie","Bob Dylan","Jimi Hendrix","Marvin Gaye","Barry White",
  "Luther Vandross","Al Green",
  "The Beatles","Queen","The Rolling Stones","Led Zeppelin","Pink Floyd","AC/DC","Nirvana","Guns N' Roses","Metallica","ABBA",
  "Bee Gees","U2","Coldplay","Red Hot Chili Peppers","Linkin Park","Foo Fighters","The Who","The Doors","Aerosmith","Bon Jovi",
  "Green Day","Oasis","Radiohead","Pearl Jam","Depeche Mode","Iron Maiden","Black Sabbath","Maroon 5","Imagine Dragons","Arctic Monkeys",
  "Blink-182","Gorillaz","Daft Punk","Earth, Wind & Fire",
  "Beyoncé","Rihanna","Taylor Swift","Lady Gaga","Adele","Ed Sheeran","Billie Eilish","Bruno Mars","Justin Bieber","The Weeknd",
  "Shakira","Dua Lipa","Harry Styles","Ariana Grande","Miley Cyrus","Selena Gomez","Katy Perry","Sia","Demi Lovato","Camila Cabello",
  "Halsey","Lana Del Rey","Lizzo","Doja Cat","SZA","Olivia Rodrigo",
  "Eminem","Jay-Z","Kanye West","Drake","Kendrick Lamar","Tupac Shakur","Notorious B.I.G.","Snoop Dogg","Dr. Dre","50 Cent",
  "Lil Wayne","Nicki Minaj","Cardi B","Travis Scott","Post Malone","Lil Nas X","Megan Thee Stallion","21 Savage","Future","J. Cole",
  "Tyler, the Creator","Ice Cube","Missy Elliott","Lauryn Hill","Wiz Khalifa","Childish Gambino","Wu-Tang Clan","Outkast","Pop Smoke","Juice WRLD",
  "XXXTENTACION","Mac Miller","Wyclef Jean","Young Thug","Playboi Carti","Lil Baby","Metro Boomin","Migos",
  "Bad Bunny","Daddy Yankee","J Balvin","Maluma","Ozuna","Karol G","Anitta","Rosalía","Rauw Alejandro","Anuel AA",
  "Marc Anthony","Pitbull","Juanes","Romeo Santos",
  "Burna Boy","Wizkid","Davido","Tems","Fela Kuti","Youssou N'Dour","Miriam Makeba","Cesária Évora","Angélique Kidjo",
  "Diamond Platnumz","Stromae","Aya Nakamura",
  "BTS","BLACKPINK","Stray Kids","Twice",
  "Amy Winehouse","Britney Spears","Spice Girls","One Direction","Robbie Williams","Phil Collins","George Michael","Seal","Sam Smith","Calvin Harris","Dave",
  "David Guetta","Marshmello","Avicii","Tiësto","Skrillex","The Chainsmokers","Kygo",
  "Usher","Chris Brown","Alicia Keys","John Legend","Khalid","Ne-Yo","Tory Lanez","Boyz II Men","TLC","Destiny's Child",
  "PARTYNEXTDOOR","Bryson Tiller","Summer Walker","Mariah the Scientist","Jacquees","Brent Faiyaz","Ty Dolla $ign","Mario",
  "Paramore","My Chemical Romance","Fall Out Boy","Panic! at the Disco","The Killers","Twenty One Pilots","Evanescence",
  "System of a Down","Rammstein","Slipknot","Ozzy Osbourne","Backstreet Boys","NSYNC","Avril Lavigne","Alanis Morissette","Gwen Stefani",
  "Pharrell Williams","will.i.am","Black Eyed Peas","Lenny Kravitz","Sade","Jamiroquai","Sean Paul","Shaggy","Damian Marley",
  "Jimmy Cliff","Christina Aguilera","Jennifer Lopez",
  // ATLETAS & DESPORTO
  "Cristiano Ronaldo","Lionel Messi","Kylian Mbappé","Erling Haaland","Vinícius Júnior","Jude Bellingham","Lamine Yamal","Phil Foden","Bukayo Saka",
  "Mohamed Salah","Sadio Mané","Neymar","Kevin De Bruyne","Robert Lewandowski","Virgil van Dijk","Harry Kane","Bruno Fernandes","Bernardo Silva",
  "Son Heung-min","Victor Osimhen","Achraf Hakimi","Pedri","Gavi","Rodri","Florian Wirtz","Cole Palmer","Declan Rice","Marcus Rashford",
  "Antoine Griezmann","Ousmane Dembélé","Federico Valverde","Darwin Núñez","Alisson Becker","Ederson","Thibaut Courtois",
  "Rúben Dias","Thiago Silva","Julián Álvarez","Enzo Fernández",
  "Pelé","Diego Maradona","Zinedine Zidane","Ronaldinho","Ronaldo Fenómeno","Thierry Henry","David Beckham","Zlatan Ibrahimović",
  "Kaká","Roberto Carlos","Didier Drogba","Samuel Eto'o","Andrea Pirlo","Paolo Maldini","Gianluigi Buffon","Luka Modrić",
  "Sergio Ramos","Wayne Rooney","Steven Gerrard","Frank Lampard","Patrick Vieira","Dennis Bergkamp","Ryan Giggs","Paul Scholes",
  "Rio Ferdinand","Johan Cruyff","Franz Beckenbauer","Gerd Müller","Marco van Basten","Rivaldo","Romário","George Weah",
  "Jay-Jay Okocha","Roger Milla","Yaya Touré","Luis Suárez","Edinson Cavani","James Rodríguez","Gareth Bale","Paul Pogba","N'Golo Kanté","Olivier Giroud",
  "Michael Jordan","LeBron James","Kobe Bryant","Stephen Curry","Kevin Durant","Shaquille O'Neal","Giannis Antetokounmpo",
  "Luka Dončić","Nikola Jokić","Magic Johnson","Larry Bird","Kareem Abdul-Jabbar","Allen Iverson","Dwyane Wade","Tim Duncan",
  "Dirk Nowitzki","James Harden","Russell Westbrook","Kawhi Leonard","Chris Paul",
  "Roger Federer","Rafael Nadal","Novak Djokovic","Serena Williams","Carlos Alcaraz","Naomi Osaka","Venus Williams","Maria Sharapova",
  "Steffi Graf","Pete Sampras","Andre Agassi","John McEnroe","Björn Borg","Coco Gauff","Jannik Sinner",
  "Usain Bolt","Carl Lewis","Jesse Owens","Mo Farah","Eliud Kipchoge","Florence Griffith-Joyner","Allyson Felix",
  "Muhammad Ali","Mike Tyson","Floyd Mayweather","Manny Pacquiao","Canelo Álvarez","Anthony Joshua","Tyson Fury",
  "George Foreman","Lennox Lewis","Sugar Ray Leonard","Oscar De La Hoya","Evander Holyfield",
  "Conor McGregor","Jon Jones","Israel Adesanya","Alex Pereira","Khabib Nurmagomedov","Amanda Nunes","Anderson Silva","Georges St-Pierre","Ronda Rousey","Charles Oliveira",
  "Lewis Hamilton","Max Verstappen","Ayrton Senna","Michael Schumacher","Sebastian Vettel","Fernando Alonso",
  "Charles Leclerc","Lando Norris","Niki Lauda","Kimi Räikkönen",
  "Michael Phelps","Simone Biles","Nadia Comăneci","Katie Ledecky",
  "Tiger Woods","Tom Brady","Wayne Gretzky","Tony Hawk","Kelly Slater","Valentino Rossi","Marc Márquez","Sachin Tendulkar","Virat Kohli",
  "Pierre-Emerick Aubameyang","Riyad Mahrez","Hakim Ziyech","André Onana","Edouard Mendy","Sébastien Haller",
  "The Rock","John Cena","The Undertaker","Stone Cold Steve Austin","Hulk Hogan","Roman Reigns","Rey Mysterio","Triple H","Brock Lesnar","Randy Orton",
  // FILMES & SÉRIES
  "Star Wars","Matrix","Indiana Jones","Mad Max","John Wick","Kill Bill","Top Gun","Die Hard","Gladiador","300",
  "Tróia","Braveheart","Piratas das Caraíbas","Missão Impossível","Bad Boys","Rush Hour","Rambo","Rocky","Transformers","Jurassic Park","Baby Driver","Velozes e Furiosos",
  "Vingadores: Endgame","Homem-Aranha","Batman","Superman","Pantera Negra","Homem de Ferro","Capitão América","Thor","Hulk","Deadpool",
  "Mulher-Maravilha","Aquaman","Doutor Estranho","Guardiões da Galáxia","Joker","Venom","X-Men","Flash","Liga da Justiça",
  "Avatar","Interestelar","Inception","Duna","Blade Runner","Alien","Terminator","E.T.","Predator","Robocop",
  "O Exorcista","It","O Iluminado","Conjuring","Saw","Pânico","Sexta-Feira 13","Halloween","Annabelle","Get Out","Hereditário","O Silêncio dos Inocentes","Ilha do Medo",
  "Titanic","O Padrinho","Forrest Gump","Pulp Fiction","Fight Club","Scarface","O Lobo de Wall Street","A Lista de Schindler",
  "Shawshank Redemption","Green Mile","O Pianista","A Vida é Bela","Taxi Driver","O Náufrago","Whiplash","Parasita",
  "Oppenheimer","Barbie","Django Livre","Bastardos Inglórios","The Revenant","A Procura da Felicidade","Snowfall","Power",
  "Shrek","Os Simpsons","Ace Ventura","Se Beber Não Case","Mrs. Doubtfire","Men in Black","O Show de Truman",
  "Rei Leão","Frozen","Toy Story","Nemo","Coco","Encanto","Moana","Aladdin","A Pequena Sereia","Mulan",
  "Ratatouille","Up","Inside Out","Wall-E","Kung Fu Panda","Madagascar","A Era do Gelo","Minions","Lilo & Stitch",
  "Os Incríveis","A Bela e a Fera","Cinderela","Branca de Neve","Dragon Ball","Naruto","One Piece","Pokémon","Spider-Verse","Sonic","Tom e Jerry",
  "Game of Thrones","Breaking Bad","Stranger Things","La Casa de Papel","Narcos","Peaky Blinders","The Walking Dead","Prison Break","Vikings","Squid Game",
  "The Crown","Succession","The Last of Us","House of the Dragon","Ozark","Dexter","Lost","The Boys","Lupin","Cobra Kai","Wednesday","The Witcher","Arcane","Teen Wolf",
  "Friends","The Office","How I Met Your Mother","The Big Bang Theory","Brooklyn Nine-Nine","Modern Family","Seinfeld","Family Guy","South Park","Rick and Morty",
  "Black Mirror","You","Dark","Mindhunter","True Detective",
  "Attack on Titan","Demon Slayer","Jujutsu Kaisen","Death Note","My Hero Academia","Fullmetal Alchemist",
  "Big Brother","MasterChef","The Voice","American Idol","Survivor",
  "Bohemian Rhapsody","La La Land","Grease","O Rei do Show","8 Mile",
  // PESSOAS FAMOSAS & LÍDERES
  "Nelson Mandela","Martin Luther King Jr.","Mahatma Gandhi","Abraham Lincoln","Winston Churchill","John F. Kennedy",
  "Franklin D. Roosevelt","George Washington","Theodore Roosevelt","Ronald Reagan","Barack Obama","Che Guevara","Fidel Castro",
  "Charles de Gaulle","Margaret Thatcher","Rainha Vitória","Rainha Elizabeth II","Rei Charles III","Princesa Diana",
  "Eva Perón","Simón Bolívar","Rosa Parks","Anne Frank",
  "Donald Trump","Vladimir Putin","Joe Biden","Xi Jinping","Kim Jong-un","Volodymyr Zelensky","Emmanuel Macron","Angela Merkel",
  "Justin Trudeau","Narendra Modi","Lula da Silva","Jair Bolsonaro","Papa Francisco",
  "Napoleão Bonaparte","Cleópatra","Júlio César","Alexandre o Grande","Gengis Khan","Henrique VIII","Maria Antonieta",
  "Luís XIV","Marco Aurélio","Nero","Spartacus",
  "Cristóvão Colombo","Vasco da Gama","Fernão de Magalhães","Marco Polo","Neil Armstrong","Yuri Gagarin","Amelia Earhart",
  "Albert Einstein","Isaac Newton","Nikola Tesla","Thomas Edison","Stephen Hawking","Marie Curie","Charles Darwin",
  "Galileu Galilei","Leonardo da Vinci","Alexander Graham Bell","Louis Pasteur",
  "Aristóteles","Platão","Sócrates","Karl Marx","Sigmund Freud","Sun Tzu","Confúcio","Nicolau Maquiavel","Tales de Mileto",
  "Jesus Cristo","Buda","Maomé","Moisés","Madre Teresa","Papa João Paulo II","Dalai Lama",
  "Elon Musk","Jeff Bezos","Bill Gates","Steve Jobs","Mark Zuckerberg","Warren Buffett","Oprah Winfrey",
  "Malala Yousafzai","Greta Thunberg","Desmond Tutu","Emmeline Pankhurst","Harriet Tubman",
  "Patrice Lumumba","Kwame Nkrumah","Haile Selassie","Jomo Kenyatta","Julius Nyerere","Robert Mugabe","Idi Amin",
  "Samora Machel","Eduardo Mondlane","Thomas Sankara","Paul Kagame","Kofi Annan","Wangari Maathai",
  "Adolf Hitler","Joseph Stalin","Benito Mussolini","Saddam Hussein","Osama bin Laden","Muammar Gaddafi",
  "Pablo Picasso","Vincent van Gogh","Frida Kahlo","Andy Warhol","Banksy","Salvador Dalí","Michelangelo","William Shakespeare","Mia Couto",
  "Al Capone","Pablo Escobar","El Chapo","Jack the Ripper","Bonnie e Clyde",
  // ATORES & ENTRETENIMENTO
  "Leonardo DiCaprio","Tom Hanks","Brad Pitt","Will Smith","Dwayne Johnson","Ryan Reynolds","Keanu Reeves","Tom Cruise",
  "Robert Downey Jr.","Chris Hemsworth","Chris Evans","Denzel Washington","Samuel L. Jackson","Morgan Freeman","Matt Damon",
  "Ben Affleck","Johnny Depp","Joaquin Phoenix","Adam Driver","Pedro Pascal","Timothée Chalamet","Tom Holland","Robert Pattinson",
  "Oscar Isaac","Jason Momoa","Idris Elba","Michael B. Jordan","Chadwick Boseman","Jake Gyllenhaal","Hugh Jackman",
  "Scarlett Johansson","Angelina Jolie","Margot Robbie","Zendaya","Florence Pugh","Ana de Armas","Gal Gadot","Jennifer Lawrence",
  "Emma Watson","Emma Stone","Anne Hathaway","Natalie Portman","Viola Davis","Lupita Nyong'o","Halle Berry","Sandra Bullock",
  "Julia Roberts","Meryl Streep","Nicole Kidman","Charlize Theron","Jenna Ortega","Sydney Sweeney",
  "Al Pacino","Robert De Niro","Jack Nicholson","Marlon Brando","Clint Eastwood","Anthony Hopkins","Sean Connery",
  "Harrison Ford","Daniel Day-Lewis","Gary Oldman","Russell Crowe","Charles Chaplin","Bruce Willis",
  "Marilyn Monroe","Audrey Hepburn","Elizabeth Taylor",
  "Kevin Hart","Jim Carrey","Adam Sandler","Robin Williams","Eddie Murphy","Chris Rock","Dave Chappelle","Steve Carell",
  "Jack Black","Ben Stiller","Owen Wilson","Will Ferrell","Melissa McCarthy","Seth Rogen","Rebel Wilson","Mike Myers","Sacha Baron Cohen",
  "Steven Spielberg","Quentin Tarantino","Christopher Nolan","Martin Scorsese","James Cameron","Ridley Scott","Tim Burton",
  "Stanley Kubrick","Alfred Hitchcock","Denis Villeneuve","Greta Gerwig","Jordan Peele","Guillermo del Toro","Bong Joon-ho","Hayao Miyazaki",
  "Ellen DeGeneres","Jimmy Fallon","Jimmy Kimmel","Stephen Colbert","Trevor Noah","Conan O'Brien","Joe Rogan","David Letterman","Graham Norton","James Corden",
  "Kim Kardashian","Kylie Jenner","Kendall Jenner","Khloé Kardashian","MrBeast","PewDiePie","Logan Paul","Jake Paul","KSI",
  "IShowSpeed","Khaby Lame","Kai Cenat","Duke Dennis","Fanum","DDG","Damson Idris",
  "Gordon Ramsay","Jamie Oliver","Salt Bae","Guy Fieri",
  "Naomi Campbell","Gisele Bündchen","Tyra Banks","Heidi Klum","Bella Hadid","Gigi Hadid",
  // MARCAS & EMPRESAS
  "Google","Apple","Microsoft","Amazon","Facebook","Instagram","TikTok","YouTube","WhatsApp","Twitter","Snapchat","Telegram",
  "Reddit","LinkedIn","Pinterest","Spotify","Netflix","Discord","Twitch","Zoom","ChatGPT","Tinder",
  "Samsung","Huawei","Xiaomi","Sony","Nintendo","PlayStation","Xbox","Tesla","Intel","Nvidia",
  "Nike","Adidas","Puma","Gucci","Louis Vuitton","Chanel","Prada","Hermès","Versace","Balenciaga","Dior",
  "Zara","H&M","Shein","Supreme","Off-White","Jordan","New Balance","Converse","Vans",
  "McDonald's","KFC","Burger King","Subway","Pizza Hut","Domino's","Starbucks","Coca-Cola","Pepsi","Red Bull","Nutella","Oreo","Nescafé","Heineken","Corona","Guinness",
  "Ferrari","Lamborghini","Porsche","BMW","Mercedes-Benz","Audi","Volkswagen","Toyota","Honda","Ford","Bugatti","Rolls-Royce","Bentley","Jeep",
  "Visa","Mastercard","PayPal","Bitcoin","Revolut",
  "Disney","Warner Bros","Pixar","Marvel","DC Comics","HBO","Amazon Prime","Disney+","UFC","FIFA","NBA","Champions League",
  "Uber","Airbnb","Bolt","Booking.com","Ryanair","Emirates",
  "IKEA","Walmart","eBay","AliExpress","Costco",
  "Dove","Nivea","L'Oréal","Gillette","Colgate",
  "LEGO","Hot Wheels","Monopoly","Google Maps","Wikipedia","Shazam","JBL",
  // LUGARES & LANDMARKS
  "Torre Eiffel","Estátua da Liberdade","Pirâmides do Egito","Muralha da China","Coliseu de Roma","Taj Mahal",
  "Cristo Redentor","Machu Picchu","Big Ben","Stonehenge","Sagrada Família","Acrópole de Atenas","Petra","Angkor Wat",
  "Chichén Itzá","Torre de Pisa","Alhambra",
  "Paris","Londres","Roma","Barcelona","Madrid","Lisboa","Amesterdão","Berlim","Praga","Viena","Veneza","Istambul","Atenas","Dublin","Copenhaga","Moscovo",
  "Nova Iorque","Los Angeles","Las Vegas","Miami","São Paulo","Rio de Janeiro","Buenos Aires","Havana","Cidade do México","Lima","Bogotá","Toronto",
  "Tóquio","Dubai","Pequim","Xangai","Hong Kong","Singapura","Seul","Bangkok","Bali","Mumbai","Jerusalém","Meca",
  "Cairo","Cidade do Cabo","Joanesburgo","Lagos","Nairobi","Marrakech","Luanda","Maputo","Acra","Addis Abeba",
  "Estados Unidos","Brasil","Portugal","Espanha","França","Inglaterra","Itália","Alemanha","Japão","China","Rússia",
  "Canadá","Austrália","México","Argentina","Colômbia","Cuba","Egito","Nigéria","África do Sul","Marrocos","Moçambique","Angola",
  "Coreia do Sul","Coreia do Norte","Tailândia","Turquia","Israel","Jamaica","Grécia","Índia",
  "Grand Canyon","Cataratas do Niágara","Cataratas Vitória","Monte Everest","Kilimanjaro","Amazónia","Deserto do Saara",
  "Monte Fuji","Galápagos","Ilhas Maldivas","Santorini","Bora Bora","Table Mountain","Aurora Boreal","Grande Barreira Coral",
  "Mar Morto","Rio Nilo","Rio Amazonas","Triângulo das Bermudas",
  "Burj Khalifa","Casa Branca","Vaticano","Buckingham Palace","Kremlin","Pentágono","Louvre","Ponte Golden Gate",
  "Times Square","Hollywood","Wall Street","Alcatraz","Área 51",
  "Maracanã","Camp Nou","Santiago Bernabéu","Wembley","Old Trafford","Anfield",
  "Ibiza","Mykonos","Cancún","Hawaii","Zanzibar","Seychelles","Mônaco","Dubrovnik",
  // CIÊNCIA, ESPAÇO & NATUREZA
  "Sol","Lua","Marte","Júpiter","Saturno","Vénus","Mercúrio","Neptuno","Urano","Plutão","Asteroide","Cometa",
  "Estrela Cadente","Via Láctea","Buraco Negro","Big Bang","Sistema Solar","Planeta Terra",
  "NASA","SpaceX","Apollo 11","Estação Espacial Internacional","Hubble","James Webb",
  "Leão","Elefante","Tubarão","Baleia","Golfinho","Águia","Gorila","Cobra","Crocodilo","Polvo","Urso","Lobo",
  "Girafa","Tigre","Pinguim","Hipopótamo","Camaleão","Rinoceronte","Zebra","Canguru","Koala","Panda","Tartaruga",
  "Papagaio","Flamingo","Coruja","Morcego","Aranha","Abelha","Borboleta",
  "T-Rex","Dinossauro","Mamute","Dodo",
  "Vulcão","Tsunami","Terramoto","Furacão","Tornado","Eclipse","Arco-Íris","Relâmpago",
  "Coração","Cérebro","DNA","Pulmões","Esqueleto","Ultrassom",
  "Eletricidade","Telescópio","Microscópio","Bússola","Dinamite","Penicilina","Vacina","Raio-X","Internet",
  "Gravidade","Átomo","Evolução","Fóssil","Tabela Periódica",
  "Ouro","Diamante","Petróleo","Oxigénio","Gasolina",
  // COMIDA & BEBIDA
  "Pizza","Hambúrguer","Sushi","Tacos","Burrito","Kebab","Shawarma","Ramen","Pad Thai","Curry","Paella","Lasanha",
  "Carbonara","Risoto","Fish and Chips","Ceviche","Feijoada","Bacalhau","Dim Sum","Biryani","Falafel","Hummus",
  "Guacamole","Poke Bowl","Nachos","Fondue","Churrasco","Cachorro-Quente","Frango Frito","Empanada","Samosa",
  "Chocolate","Gelado","Cheesecake","Tiramisù","Croissant","Waffle","Panqueca","Brownie","Macaron","Donut",
  "Bolo de Aniversário","Pudim","Crème Brûlée","Churros","Açaí",
  "Banana","Manga","Ananás","Melancia","Abacate","Morango","Limão","Laranja","Maçã",
  "Batata Frita","Pipoca","Doritos","Pringles","M&M's","Kit Kat","Snickers","Gomas",
  "Fanta","Sprite","Monster Energy","Café","Chá","Sumo de Laranja","Água de Coco","Bubble Tea","Milkshake","Smoothie","Limonada",
  "Cerveja","Vinho","Champanhe","Whisky","Vodka","Tequila","Rum","Gin","Mojito","Caipirinha","Sangria","Margarita",
  "Piri-Piri","Wasabi","Ketchup","Mostarda","Azeite","Mel","Sal","Pimenta",
  // EVENTOS & MOMENTOS HISTÓRICOS
  "Segunda Guerra Mundial","Primeira Guerra Mundial","Guerra Fria","Guerra do Vietname","Guerra do Golfo","Guerra da Ucrânia",
  "Revolução Francesa","Revolução Industrial","Revolução Russa","Queda do Muro de Berlim","Primavera Árabe","4 de Julho",
  "11 de Setembro","Pandemia Covid-19","Chegada à Lua","Chernobyl","Fukushima","Bomba de Hiroshima","Titanic (naufrágio)",
  "7 a 1 Brasil Alemanha","Mão de Deus","Milagre de Istambul","Cabeçada do Zidane","Dream Team 1992",
  "Bolt 100m Pequim","Final NBA 2016","Leicester 2016","Argentina Mundial 2022","Portugal Euro 2016","Rumble in the Jungle","Tyson vs Holyfield",
  "Woodstock","Live Aid","Rock in Rio","Coachella","Tomorrowland","Glastonbury","MTV anos 90",
  "Oscar","Grammy","Nobel","Ballon d'Or","Miss Universo","Eurovisão","Met Gala","Fashion Week",
  "Natal","Ano Novo","Carnaval","Dia dos Namorados","Dia das Mães","Páscoa","Ramadão",
  "Dia de Ação de Graças","Dia dos Mortos","Oktoberfest","Ano Novo Chinês","Black Friday","Super Bowl",
  "Watergate","WikiLeaks","Caso Snowden","Panama Papers",
  "Copa do Mundo","Olimpíadas","Wimbledon","Tour de France","Mundial de F1","NBA Finals","UFC Pay-Per-View","Copa América","Euro (futebol)","Copa Africana das Nações",
  // PERSONAGENS FICTÍCIOS & JOGOS
  "Spider-Man","Wolverine","Black Widow","Thanos","Harley Quinn","Loki","Darth Vader","Magneto","Catwoman","Black Panther",
  "Mickey Mouse","Simba","Elsa","Woody","Buzz Lightyear","Olaf","Grinch","Stitch","Rapunzel","Mufasa","Scar","Timon e Pumba","Gru",
  "Goku","Vegeta","Sasuke","Luffy","Gojo","Light Yagami","L","Eren Jaeger","Pikachu","Yuji Itadori",
  "Homer Simpson","Bart Simpson","SpongeBob","Bugs Bunny","Scooby-Doo","Peter Griffin","Eric Cartman","Rick Sanchez","Finn e Jake","Baby Yoda",
  "Walter White","Jon Snow","Daenerys Targaryen","Tyrion Lannister","Eleven","Professor","Tommy Shelby","Jesse Pinkman","Homelander","Jack Sparrow","Hannibal Lecter","Michael Scott",
  "Luigi","Pac-Man","Lara Croft","Kratos","Master Chief","Link","Crash Bandicoot","Mega Man","Donkey Kong","Kirby","Steve","Creeper",
  "Minecraft","Fortnite","GTA","Call of Duty","League of Legends","Among Us","Roblox","Valorant","God of War","Elden Ring","Red Dead Redemption","Zelda","Need for Speed",
  "Xadrez","Uno","Jenga","Poker","Dominó",
  "Harry Potter","Hermione Granger","Voldemort","Dumbledore","Gandalf","Frodo","Sherlock Holmes","Robin Hood","Drácula","Frankenstein","Peter Pan","Pinóquio",
  // OBJETOS & CONCEITOS
  "Guarda-chuva","Óculos de Sol","Mochila","Relógio","Espelho","Chave","Vela","Isqueiro","Preservativo","Fralda",
  "Escova de Dentes","Tesoura","Almofada","Cobertor","Toalha","Bicicleta","Skate","Patins","Capacete","Lanterna",
  "Máquina Fotográfica","Binóculos","Passaporte",
  "Médico","Polícia","Bombeiro","Piloto","Astronauta","Palhaço","Pirata","Ninja","Cozinheiro","Dentista",
  "Enfermeiro","Advogado","Juiz","Padre","Agricultor","Pescador","Carpinteiro","Mecânico","Barbeiro",
  "Selfie","Ressaca","Primeiro Beijo","Friendzone","Crush","Ghosting","Déjà Vu","Saudade","Karma",
  "Ciúme","Vergonha","Fofoca","Lua de Mel","Pedido de Casamento","Despedida de Solteiro","Tatuagem","Piercing","Peruca","Bigode","Barba",
  "Ambulância","Sirene","Algemas","Troféu","Medalha","Coroa","Trono","Castelo","Cavalo","Espada","Escudo","Arco e Flecha",
  // EXTRAS
  "James Bond","Crepúsculo","Jogos Vorazes","O Aviador","Os Infiltrados","2001: Odisseia no Espaço",
  "Apocalypse Now","Os Bons Companheiros","Romeu e Julieta","A Noite Estrelada","A Última Ceia",
  "Celine Dion","Christian Bale","Orson Welles","Heath Ledger",
  "Forbes","Cannes","Mikhail Gorbachev","Canal do Panamá","Canal de Suez","Vale do Silício","Disneyland","Corrida Espacial","Crise de 2008",
];

export const ITEMS_MZ = [
  // MÚSICOS MZ
  "Wazimbo","Stewart Sukuma","Mingas","Ghorwane","Eyuphuro","Orchestra Marrabenta Star","Fany Pfumo","Dilon Djindji",
  "Hortêncio Langa","Feliciano dos Santos","Neyma","Lizha James","Marllen","Lourena Nhate","Anita Macuácua",
  "Ziqo","Mr. Bow","Valdemiro José","Tamyris Moiane","Edmázia Mayembe","Pérola","Iveth","Percella","Melony","Denilson",
  "Dygo Boy","Shabba Wonder","Doppaz","Alcy Coluamba","Deborah Duarte","Azagaia","Hernâni da Silva","Bander",
  "Bangla 10","Kiba the Seven","Laylizzy",
  "King Cizzy","Djimetta","MC Roger","Mr. Kuka",
  "C4 Pedro","Anselmo Ralph","Nelson Freitas","Calema","Yuri da Cunha","Matias Damásio","Dji Tafinha",
  "Diamond Platnumz","Harmonize","Innoss'B","Fally Ipupa","Koffi Olomide","Massukos","Xidiminguana","Mafalala Jazz",
  "Grupo Kapa","Os Primos","New Joint","Valentino De La Vega","Kenny Yuran","Edu All Talents","Salênsio","Coelhinho",
  "Frede Josiah","Twenty Fingers","Hot Blaze","Hélio Beatz","Stefânia Leonel","Puto Aires","Edy Puff","King Clay",
  "Cheny","Tio Edson","Gito","Zena Bacar","Yadah","Nuno Abdul","Sheldon","Justino Ubakka",
  // COMIDA & BEBIDA MZ
  "Matapa","Xima","Caril de Amendoim","Caril de Coco","Galinha à Zambeziana","Frango à Cafreal","Galinha Assada",
  "Caril de Caranguejo","Caril de Camarão","Cacana","Feijão Nhemba","Mucapata","Couve com Amendoim","Arroz de Coco",
  "Peixe Grelhado","Carapau Grelhado","Lagosta de Moçambique","Pão com Badjia","Caracóis","Chamussas","Badjias","Rissóis",
  "Maheu","Amendoim Torrado","Mandioca Frita","Batata-Doce","Bolo de Mandioca","Bolo Polana","Caju Torrado","Pudim de Leite","Alitas",
  "Manga","Papaia","Coco","Caju","Banana","Ananás","Goiaba","Tangerina","Melancia","Abacate",
  "2M","Laurentina","Laurentina Preta","Manica (cerveja)","Tipo","Tipo Tinto","Nipa","Sura","Uputsu","Tontonto",
  "Aguardente","Sumo de Caju","Sumo de Manga","Chá de Limão","Corona","Heineken","Txilar","Piri-Piri",
  "Leite de Coco","Amendoim Pilado","Mandioca","Coco Ralado",
  // RESTAURANTES MZ
  "Galitos","Mimmos","Fernando's","Mundo's","Frango King","Barcelos","Steers","Nando's","Chicken Inn","Debonairs Pizza",
  "Ocean Basket","Zambi","Nautilus","Madjeje","South Beach","Acácias",
  // FIGURAS HISTÓRICAS & POLÍTICAS MZ
  "Samora Machel","Eduardo Mondlane","Joaquim Chissano","Armando Guebuza","Filipe Nyusi","Daniel Chapo",
  "Venâncio Mondlane","Graça Machel","Josina Machel","Alberto Chipande","Marcelino dos Santos","Afonso Dhlakama","Daviz Simango",
  // CULTURA & ARTES MZ
  "Mia Couto","Paulina Chiziane","José Craveirinha","Noémia de Sousa","Ungulani Ba Ka Khosa","Malangatana","Alberto Chissano","Reinata Sadimba",
  // DESPORTO MZ
  "Eusébio","Mário Coluna","Hilário","Tico-Tico","Genito Bila","Dominguês","Dário","Simão","Almiro","Kito",
  "Chiquinho Conde","Reinaldo","Lurdes Mutola","Júlio Magalhães","Stélio Leonel","Gama","Ana Guedes","Salimo Abdula",
  // MEDIA & ENTRETENIMENTO MZ
  "Zé Forjaz","Mabulu","Noslen Araújo","Maira Santos","Cardo Podcast (Tu Para Tu)","Guyzelh Ramos","Maxh 258",
  "Armando e Daniela","Victor Renér","Igor Idelson",
  // MÚSICA & DANÇA TRADICIONAL
  "Marrabenta","Pandza","Timbila","Mapiko","Tufo","Xigubo","Ngoma","Makwaela","N'kwaya",
  // CULTURA & TRADIÇÕES
  "Capulana","Xibelane","Muchiro","Carapinha","Lenço na Cabeça","Lobolo","Xitique","Ukanyi","Xicuembo",
  "Curandeiro","Nyanga","Casamento Tradicional",
  // TRANSPORTES & MERCADOS
  "Chapa","Machimbombo","My Love","Txopela","Tuk-Tuk","Motorizada","Toyota Hiace",
  "Mercado Central de Maputo","Mercado do Xipamanine","Mercado do Peixe","FEIMA","Barraca","Dumba Nengue","Kandonga",
  // INSTRUMENTOS
  "Mbira","Marimba","Djembe","Xiphefo","Likuti",
  // MEDIA
  "TVM","STV","Miramar","Rádio Moçambique","Jornal Notícias","Canal de Moçambique",
  // LÍNGUAS
  "Changana","Ronga","Macua","Sena","Ndau","Makonde","Tsonga","Lomwe","Chuabo",
  // GÍRIA & EXPRESSÕES
  "Yah","Bazar","Chupar","Magueva","Tropa","Mufana","Patrão","Boss","Pita","Dica","Xirico","Mukhero",
  // EVENTOS MZ
  "Dia da Independência MZ","Dia dos Heróis","Festival Azgo","Tofo Music Festival","Carnaval de Maputo","Miss Moçambique",
  // DESPORTO MZ
  "Mambas","Moçambola","Ferroviário de Maputo","Costa do Sol FC","Maxaquene FC","Black Bulls","Liga Muçulmana",
  "UD do Songo","Desportivo de Maputo","Estádio do Zimpeto","Estádio da Machava",
  // BAIRROS DE MAPUTO
  "Mafalala","Polana","Sommerschield","Costa do Sol","Alto-Maé","Maxaquene","Zimpeto","Baixa de Maputo",
  "Coop","Chamanculo","Hulene","Xipamanine",
  // CIDADES MZ
  "Maputo","Matola","Beira","Nampula","Quelimane","Tete","Pemba","Xai-Xai","Chimoio","Inhambane",
  "Lichinga","Nacala","Angoche","Montepuez","Cuamba","Maxixe","Vilankulo","Chókwè","Chibuto","Mocuba",
  "Gurúè","Gondola","Dondo","Mandlakazi","Massinga","Moatize","Milange","Marracuene","Manhiça",
  // PRAIAS & DESTINOS
  "Tofo","Barra","Ponta do Ouro","Bilene","Macaneta","Costa do Sol (praia)","Praia do Wimbe",
  "Ponta Malongane","Závora","Jangamo","Chidenguele",
  // ILHAS
  "Ilha de Moçambique","Ilha do Ibo","Ilha de Inhaca","Ilha do Bazaruto","Ilha de Santa Carolina",
  "Arquipélago do Bazaruto","Arquipélago das Quirimbas",
  // PARQUES & NATUREZA
  "Parque Nacional da Gorongosa","Parque Nacional do Limpopo","Reserva do Niassa","Reserva Especial de Maputo",
  "Parque Nacional do Bazaruto","Gorongosa",
  // RIOS & LAGOS
  "Rio Zambeze","Rio Limpopo","Rio Save","Rio Rovuma","Rio Incomáti","Lago Niassa",
  // MONUMENTOS MAPUTO
  "Estação Central de Maputo","Fortaleza de Maputo","Catedral de Maputo","Casa de Ferro","Museu de História Natural",
  "Praça da Independência","Praça dos Heróis","Jardim Tunduru","Ponte Maputo-Katembe","Avenida da Marginal",
  "Museu da Moeda","Jardim dos Namorados",
  // PROVÍNCIAS
  "Gaza","Sofala","Zambézia","Cabo Delgado","Niassa","Manica","Inhambane (província)","Tete (província)",
  "Nampula (província)","Maputo (província)",
  // INFRAESTRUTURA
  "Barragem de Cahora Bassa","Porto de Maputo","Porto da Beira","Porto de Nacala","Aeroporto de Maputo","EN1",
  "Katembe","Ressano Garcia","Namaacha",
  // HISTÓRIA MZ
  "Independência de Moçambique","Luta Armada de Libertação","Guerra Civil de Moçambique","Acordo Geral de Paz 1992",
  "Massacre de Mueda","25 de Junho","4 de Outubro","3 de Fevereiro","Período Colonial","Conferência de Berlim",
  "FRELIMO","RENAMO","MDM","PODEMOS","Assembleia da República","Constituição de Moçambique","Metical","Banco de Moçambique",
  // DESASTRES NATURAIS
  "Ciclone Idai","Ciclone Kenneth","Ciclone Freddy","Inundações de 2000",
  "Bandeira de Moçambique","Hino de Moçambique",
  // HISTÓRIA COLONIAL
  "Gungunhana","Companhia de Moçambique","Companhia do Niassa",
  // EMPRESAS & SERVIÇOS MZ
  "Vodacom","Tmcel","Movitel","M-Pesa","e-Mola","Mkesh","Millennium BIM","BCI","Standard Bank MZ","Absa MZ","FNB MZ","Letshego",
  "EDM","Petromoc","Galp Moçambique","Total Moçambique","BP Moçambique","LAM","CFM","TDM","Yango",
  "Shoprite","Game","Pep","Ackermans","Mr Price","Recheio","Cash & Carry","Interfranca",
  "Hotel Polana","Hotel Cardoso","Radisson Blu Maputo","Southern Sun","Maputo Shopping","Baía Mall",
  "CDM (Cervejas de MZ)","Caju de Moçambique","Piri-Piri MZ",
  // EDUCAÇÃO & SAÚDE
  "UEM","UP","ISPU","ISCTEM","Hospital Central de Maputo","INSS","INE",
  // MINERAÇÃO & ENERGIA
  "Sasol Moçambique","Total Energies MZ","Vale Moçambique","Mozal","FACIM","Avenida Brasil",
  // TELENOVELAS & SÉRIES
  "A Escrava Isaura","O Clone","Rebelde","Malhação","Amor de Mãe","A Força do Querer","Pantanal",
  "Roque Santeiro","Da Cor do Pecado","Segundo Sol","Terra e Paixão","Vai na Fé","Morangos com Açúcar",
  // ARTISTAS BRASILEIROS POPULARES EM MZ
  "Anitta","Ivete Sangalo","Luan Santana","Wesley Safadão","Ludmilla","Gusttavo Lima","Marília Mendonça",
  "Jorge e Mateus","Henrique e Juliano","Thiaguinho","Alexandre Pires","MC Kevinho","MC Don Juan","MC Livinho",
  "MC Guimê","MC Poze do Rodo","MC Ryan SP","MC Hariel","Dennis DJ","Pedro Sampaio","MC Cabelinho","MC Daniel","MC Pedrinho",
  // SÉRIES INFÂNCIA
  "Hannah Montana","High School Musical","Camp Rock","Wizards of Waverly Place","Suite Life of Zack & Cody",
  "That's So Raven","Phineas e Ferb","Kim Possible","Violetta","Soy Luna","Descendentes","KC Undercover","Jessie",
  "Good Luck Charlie","Lab Rats","Liv and Maddie","Austin & Ally","Shake It Up","Princesa Sofia","Girl Meets World",
  "Ben 10","As Meninas Super Poderosas","Dexter's Laboratory","Johnny Bravo","Coragem o Cão Covarde","Samurai Jack",
  "Ed, Edd n Eddy","Mansão Foster","Hora de Aventura","O Incrível Mundo de Gumball","Steven Universe",
  "Os Jovens Titãs","Teen Titans Go!","Chowder","Regular Show","Oggy e as Baratas",
  "iCarly","Drake & Josh","Victorious","Henry Danger","Os Padrinhos Mágicos","Avatar: A Lenda de Aang","A Lenda de Korra",
  "Os Rugrats","Jimmy Neutron","Danny Phantom","The Thundermans",
  "Dragon Ball Z","Naruto Shippuden","Cavaleiros do Zodíaco","Bleach","Hunter x Hunter","Yu-Gi-Oh!","Inuyasha",
  "Samurai X","Fairy Tail","Boku no Hero","Super Strikers","Inazuma Eleven",
  "Mr. Bean (animação)","Doraemon","Shin Chan","Peppa Pig","Patrulha Pata","Beyblade","Bakugan","Power Rangers",
  "Lazy Town","Código Lyoko","101 Dálmatas","Peter Pan","Sininho","Tarzan","Gravity Falls","Miraculous Ladybug",
  "Winx Club","Totally Spies","Bob o Construtor","Futurama","Biggs","Trace Toca","Panda",
  "Cartoon Network","Disney Channel","Nickelodeon","Boomerang","Jim Jam",
  // WRESTLING
  "The Rock","John Cena","The Undertaker","Rey Mysterio","Roman Reigns","Brock Lesnar","Randy Orton","Triple H",
  "Stone Cold Steve Austin","Hulk Hogan","Seth Rollins","Edge","Goldberg","Batista","Kane","Big Show",
  // YOUTUBERS POPULARES EM MZ
  "Whindersson Nunes","Felipe Neto","Kondzilla","Virgínia Fonseca","Carlinhos Maia","Lucas Neto","Rezende",
  "Enaldinho","Luva de Pedreiro",
  // ANIMAÇÃO EXTRA
  "Family Guy","American Dad","Bob Esponja",
  // JOGOS MOBILE
  "Free Fire","PUBG Mobile","Subway Surfers","Temple Run","Clash Royale","Clash of Clans","Mobile Legends",
  "Dream League Soccer","eFootball (PES)",
  // INTERNACIONAIS POPULARES EM MZ
  "Chris Brown","Rihanna","Beyoncé","Drake","Burna Boy","Wizkid","Davido","Jason Derulo","Akon","Sean Paul",
  "Bob Marley","Cristiano Ronaldo","Lionel Messi","Pelé","Didier Drogba","Samuel Eto'o","Sadio Mané",
  "Mohamed Salah","Neymar","Ronaldinho",
  // OBJETOS DO QUOTIDIANO MZ
  "Geleira","Fogão a Carvão","Pilão","Esteira","Balde","Bidon","Vassoura","Catana","Enxada","Rede de Pesca",
  "Canoa","Caniço","Anzol",
  // SITUAÇÕES DO DIA-A-DIA MZ
  "Corte de Luz","Falta de Água","Hora de Ponta","Bicha (fila)","Gasosa","Comício",
  // ANIMAIS DE MZ
  "Mamba","Crocodilo","Hipopótamo","Elefante","Leão","Búfalo","Macaco","Camaleão","Lagarto","Mosquito","Barata",
  "Tartaruga Marinha","Golfinho","Tubarão-Baleia","Flamingo","Pelicano",
  // MÚSICOS MZ (novos)
  "Liloca","Catamo","Salensio","Perfect G","Yan Space","Trovoada","Kelson Most Wanted",
  // POLÍTICOS & FIGURAS MZ
  "Ossufo Momade","Venâncio Mondlane","AK-47 da bandeira","Emblema Nacional",
  // GÍRIA & EXPRESSÕES (novos)
  "Kanimambo","Salani Kahle","Hela","Boah","Massa","Mano","Brada","Maguiza","Maninas","Manas",
  "Sócio","Compa","Panya","Chongar","Tchunar","Catar massa","Mandar bitaite",
  "Estar nice","Estar tabela","Estar pelado","Cair fora","Apanhar boleia","Pegar chapa",
  "Fixe","Maningue","Maningue nice","Pa carago","Eish","Iiih","Ah pa",
  "Cota","Cotinha","Madala","Tá fixe","Tás a ver?","Não há stress","Tudo nice","Sem dramas",
  "Vai lá","Bazar daqui","Anda lá","Calma irmão","Tchopela",
  "Chapa 100","Ligação","Esquema","Movimento","Curtir","Vibrar",
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function cleanNames(arr) {
  return (arr || []).map((s) => (s ?? "").trim()).filter(Boolean).slice(0, MAX_NAMES);
}

export default function ThirtySeconds({ onBack }) {
  const [view,     setView]     = useState("setup");
  const [category, setCategory] = useState("GLOBAL");

  const [teamANames, setTeamANames] = useState(Array(MAX_NAMES).fill(""));
  const [teamBNames, setTeamBNames] = useState(Array(MAX_NAMES).fill(""));
  const [showNamesOverlay, setShowNamesOverlay] = useState(false);
  const [draftA, setDraftA] = useState(Array(MAX_NAMES).fill(""));
  const [draftB, setDraftB] = useState(Array(MAX_NAMES).fill(""));

  const hasAnyNames = useMemo(
    () => teamANames.some((n) => n.trim()) || teamBNames.some((n) => n.trim()),
    [teamANames, teamBNames]
  );

  function openNamesOverlay()   { setDraftA([...teamANames]); setDraftB([...teamBNames]); setShowNamesOverlay(true); }
  function saveNamesOverlay()   { setTeamANames([...draftA]); setTeamBNames([...draftB]); setShowNamesOverlay(false); }
  function cancelNamesOverlay() { setShowNamesOverlay(false); }

  const cleanA = useMemo(() => cleanNames(teamANames), [teamANames]);
  const cleanB = useMemo(() => cleanNames(teamBNames), [teamBNames]);
  const items  = useMemo(() => (category === "MZ" ? ITEMS_MZ : ITEMS_GLOBAL), [category]);

  const audioRef = useRef(null);
  function ensureAudio() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!audioRef.current) audioRef.current = new AudioCtx();
    if (audioRef.current.state === "suspended") audioRef.current.resume();
    return audioRef.current;
  }
  function warmupAudio() {
    try {
      const ctx = ensureAudio();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 1; g.gain.value = 0.00001;
      o.connect(g); g.connect(ctx.destination); o.start();
      setTimeout(() => o.stop(), 60);
    } catch {}
  }
  function beep(freq = 880, ms = 140, vol = 0.18) {
    try {
      const ctx = ensureAudio();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "square"; o.frequency.value = freq; g.gain.value = vol;
      o.connect(g); g.connect(ctx.destination); o.start();
      setTimeout(() => o.stop(), ms);
    } catch {}
  }
  function softBeep() {
    try {
      const ctx = ensureAudio();
      const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o1.type = "sine"; o1.frequency.value = 620;
      o2.type = "sine"; o2.frequency.value = 520;
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      o1.connect(g); o2.connect(g); g.connect(ctx.destination);
      o1.start(); o2.start();
      setTimeout(() => { try { o1.stop(); o2.stop(); } catch {} }, 150);
    } catch {}
  }

  const deckRef    = useRef([]);
  const deckPosRef = useRef(0);
  const cardIdRef  = useRef(0);

  const [card,    setCard]    = useState([]);
  const [checked, setChecked] = useState([false, false, false, false]);
  const [history, setHistory] = useState([]);
  const [collapsingItems, setCollapsingItems] = useState(new Set());

  function resetDeck() { deckRef.current = shuffle(items); deckPosRef.current = 0; }

  function drawCard() {
    const start = deckPosRef.current;
    const end   = start + CARD_SIZE;
    if (end > deckRef.current.length) { resetDeck(); }
    const next = deckRef.current.slice(deckPosRef.current, deckPosRef.current + CARD_SIZE);
    deckPosRef.current += CARD_SIZE;
    return next;
  }

  function setNewCard() {
    const next = drawCard();
    if (!next) return;
    setCard(next);
    setChecked([false, false, false, false]);
    setHistory([]);
    setCollapsingItems(new Set());
    cardIdRef.current += 1;
  }

  function loadNextCard() { setNewCard(); }

  const scoreARef       = useRef(0);
  const scoreBRef       = useRef(0);
  const roundCorrectRef = useRef(0);

  const [team,   setTeam]   = useState("A");
  const teamRef             = useRef("A");
  useEffect(() => { teamRef.current = team; }, [team]);

  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [winner, setWinner] = useState(null);
  const [idxA,   setIdxA]   = useState(0);
  const [idxB,   setIdxB]   = useState(0);

  const [swapsLeft, setSwapsLeft] = useState(SWAPS_PER_ROUND);
  const [paused,    setPaused]    = useState(false);
  const [passUsed,  setPassUsed]  = useState(false);

  const [phase,          setPhase]          = useState("ready");
  const [transitionLeft, setTransitionLeft] = useState(TRANSITION_SECONDS);
  const [readyLeft,      setReadyLeft]      = useState(READY_SECONDS);
  const [timeLeft,       setTimeLeft]       = useState(ROUND_SECONDS);

  const [roundSummaryVisible, setRoundSummaryVisible] = useState(false);
  const [roundSummaryData,    setRoundSummaryData]    = useState(null);
  const [perfectFlash,        setPerfectFlash]        = useState(false);

  function currentPlayerName() {
    const list = teamRef.current === "A" ? cleanA : cleanB;
    const idx  = teamRef.current === "A" ? idxA   : idxB;
    return list.length ? list[idx % list.length] : null;
  }

  function addPoint() {
    const cur = teamRef.current;
    roundCorrectRef.current += 1;
    if (cur === "A") {
      setScoreA((s) => { const n = s + 1; scoreARef.current = n; if (n >= WIN_SCORE) setWinner("A"); return n; });
    } else {
      setScoreB((s) => { const n = s + 1; scoreBRef.current = n; if (n >= WIN_SCORE) setWinner("B"); return n; });
    }
  }

  function initGame() {
    const startTeam = Math.random() < 0.5 ? "A" : "B";
    resetDeck(); setNewCard();
    setTeam(startTeam); teamRef.current = startTeam;
    setScoreA(0); setScoreB(0); scoreARef.current = 0; scoreBRef.current = 0;
    setWinner(null); setIdxA(0); setIdxB(0);
    setSwapsLeft(SWAPS_PER_ROUND); setPaused(false); setPassUsed(false);
    roundCorrectRef.current = 0; setCollapsingItems(new Set());
    setRoundSummaryVisible(false); setRoundSummaryData(null);
    setPerfectFlash(false);
    setPhase("transition"); setTransitionLeft(TRANSITION_SECONDS);
    setReadyLeft(READY_SECONDS); setTimeLeft(ROUND_SECONDS);
  }

  function startNewTurn(nextTeam) {
    setTeam(nextTeam); teamRef.current = nextTeam;
    if (nextTeam === "A") setIdxA((x) => x + 1); else setIdxB((x) => x + 1);
    setSwapsLeft(SWAPS_PER_ROUND); setPaused(false); setPassUsed(false);
    roundCorrectRef.current = 0; loadNextCard();
    setPhase("transition"); setTransitionLeft(TRANSITION_SECONDS);
    setReadyLeft(READY_SECONDS); setTimeLeft(ROUND_SECONDS);
  }

  function endRoundAuto() {
    if (winner) return;
    const cur      = teamRef.current;
    const nextTeam = cur === "A" ? "B" : "A";
    const correct  = roundCorrectRef.current;
    const totalPts = cur === "A" ? scoreARef.current : scoreBRef.current;
    beep(520, 160, 0.2);
    setRoundSummaryData({ team: cur, correct, total: totalPts });
    setRoundSummaryVisible(true);
    setTimeout(() => { setRoundSummaryVisible(false); startNewTurn(nextTeam); }, 3000);
  }

  function onToggleItem(i) {
    if (winner || phase !== "play" || paused || timeLeft <= 0 || checked[i]) return;
    const nc = [...checked]; nc[i] = true;
    setChecked(nc);
    setHistory((h) => [...h, i]);
    softBeep();
    addPoint();
    if (nc.every(Boolean)) {
      setPerfectFlash(true);
      setTimeout(() => setPerfectFlash(false), 900);
      setTimeout(() => loadNextCard(), 380);
    }
  }

  function undoItem(i) {
    if (!checked[i]) return;
    setChecked((c)  => { const nc = [...c]; nc[i] = false; return nc; });
    setCollapsingItems((prev) => { const n = new Set(prev); n.delete(i); return n; });
    setHistory((h) => h.filter((idx) => idx !== i));
    roundCorrectRef.current = Math.max(0, roundCorrectRef.current - 1);
    const cur = teamRef.current;
    if (cur === "A") setScoreA((s) => { const n=Math.max(0,s-1); scoreARef.current=n; return n; });
    else             setScoreB((s) => { const n=Math.max(0,s-1); scoreBRef.current=n; return n; });
    beep(420, 110, 0.15);
  }

  function swapCard() {
    if (winner || phase !== "play" || paused || swapsLeft <= 0) return;
    setSwapsLeft((x) => x - 1); loadNextCard(); beep(700, 120, 0.14);
  }

  function togglePause() {
    if (winner) return;
    setPaused((p) => !p); beep(220, 260, 0.25);
  }

  function passTurnNow() {
    if (winner || phase !== "play" || paused || passUsed) return;
    setPassUsed(true);
    beep(360, 180, 0.22);
    // Avança para o próximo jogador da MESMA equipa
    if (teamRef.current === "A") setIdxA((x) => x + 1);
    else setIdxB((x) => x + 1);
  }

  function restartGame() { initGame(); }

  function onStartFromSetup() {
    warmupAudio(); beep(880, 140, 0.18); initGame(); setView("play");
  }

  useEffect(() => {
    if (view !== "play" || winner || phase !== "transition" || paused) return;
    const id = setInterval(() => {
      setTransitionLeft((t) => {
        if (t <= 1) { clearInterval(id); setPhase("ready"); setReadyLeft(READY_SECONDS); return TRANSITION_SECONDS; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [view, winner, phase, paused]);

  useEffect(() => {
    if (view !== "play" || winner || phase !== "ready" || paused) return;
    const id = setInterval(() => {
      setReadyLeft((r) => {
        if (r <= 1) { clearInterval(id); setPhase("play"); setTimeLeft(ROUND_SECONDS); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [view, winner, phase, paused]);

  useEffect(() => {
    if (view !== "play" || winner || phase !== "play" || paused) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); endRoundAuto(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [view, winner, phase, paused]);

  const player = currentPlayerName();

  const NamesOverlay = showNamesOverlay && typeof document !== "undefined"
    ? createPortal(
        <div className="modalOverlay" onClick={cancelNamesOverlay}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">👥 Nomes das equipas</div>
              <div className="modalHint">Até {MAX_NAMES} jogadores por equipa (opcional)</div>
            </div>
            <div className="modalContent">
              <div className="namesGrid2">
                <div>
                  <div className="namesColTitle">Equipa A</div>
                  {draftA.map((val, i) => (
                    <input key={`da-${i}`} className="niceInput" placeholder={`Jogador A${i+1}`} value={val}
                      onChange={(e) => { const c=[...draftA]; c[i]=e.target.value; setDraftA(c); }} />
                  ))}
                </div>
                <div>
                  <div className="namesColTitle">Equipa B</div>
                  {draftB.map((val, i) => (
                    <input key={`db-${i}`} className="niceInput" placeholder={`Jogador B${i+1}`} value={val}
                      onChange={(e) => { const c=[...draftB]; c[i]=e.target.value; setDraftB(c); }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="modalActions">
              <button className="btnGhost"   type="button" onClick={cancelNamesOverlay}>✕ Cancelar</button>
              <button className="btnPrimary" type="button" onClick={saveNamesOverlay}>✓ Guardar</button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  const VictoryOverlay = winner
    ? createPortal(
        <div className="victoryOverlay">
          <div className="victoryBackdrop" />
          <div className="victoryCard">
            <div className="victoryTitle">🏆 Vencedor</div>
            <div className="victoryTeam">Equipa {winner}</div>
            <div className="victorySub">Primeiro a chegar a {WIN_SCORE} pontos 🎉</div>
            <div className="victoryBtns">
              <button className="victoryBtn restart" type="button" onClick={restartGame}>🔁 Jogar de novo</button>
              <button className="victoryBtn menu"    type="button" onClick={onBack}>← Voltar ao Menu</button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  const RoundSummaryOverlay = roundSummaryVisible && roundSummaryData
    ? createPortal(
        <div className="roundSummaryOverlay">
          <div className="roundSummaryCard">
            <div className="roundSummaryTeamLabel">Jogou agora</div>
            <div className="roundSummaryTeam">Equipa {roundSummaryData.team}</div>
            <div className="roundSummaryScoreRow">
              <span className="roundSummaryCorrect">{roundSummaryData.correct}</span>
              <span className="roundSummaryOf">/{CARD_SIZE}</span>
            </div>
            <div className="roundSummaryLabel">
              {roundSummaryData.correct === CARD_SIZE ? "🔥 Carta completa!" :
               roundSummaryData.correct === 0         ? "😬 Sem pontos" :
               `✅ ${roundSummaryData.correct} ${roundSummaryData.correct === 1 ? "ponto" : "pontos"}`}
            </div>
            <div className="roundSummaryTotal">Total: {roundSummaryData.total} pts</div>
            <div className="roundSummaryProgress">
              <div className="roundSummaryProgressBar" />
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  if (view === "setup") {
    return (
      <div className="setupScreen">
        <div className="setupShell">
          <header className="setupHeader">
            <div className="setupTitle">⏱️ 30 Segundos</div>
            <div className="setupSub">Escolhe categoria e escreve os nomes (opcional)</div>
          </header>
          <main className="setupBody">
            <section className="setupCard">
              <div className="setupSectionTitle">Categoria</div>
              <div className="catGrid2">
                <button type="button" className={`segBtn ${category === "GLOBAL" ? "on" : ""}`} onClick={() => setCategory("GLOBAL")}>
                  🌍 Global
                </button>
                <button type="button" className={`segBtn ${category === "MZ" ? "on" : ""}`} onClick={() => setCategory("MZ")}>
                  🇲🇿 CulturaGeral_MZ
                </button>
              </div>
              <button className="btnNames" style={{ width:"100%", marginTop:14 }} type="button" onClick={openNamesOverlay}>
                👥 {hasAnyNames ? "✏️ Editar nomes" : "Adicionar nomes (opcional)"}
              </button>
            </section>
            <div className="setupBottomSpacer" />
          </main>
          <footer className="setupFooter">
            <button className="btnBack setupFooterBtn" type="button" onClick={onBack}>← Menu</button>
            <button className="btnPrimary setupFooterBtn" type="button" onClick={onStartFromSetup}>▶️ Começar</button>
          </footer>
        </div>
        {NamesOverlay}
      </div>
    );
  }

  return (
    <div className="appBg">
      <div className="shell shellGame">

        <header className="gameHeader">
          <button className="btnBack" onClick={onBack} type="button">← Menu</button>
          <div className="headerTitleBlock">
            <div className="h1Brand">MZ Party Games</div>
            <div className="h2Game">30 Segundos</div>
          </div>
          <div className={`timerPill ${phase === "play" && timeLeft <= 5 && timeLeft > 0 ? "timerDanger" : ""}`}>
            {phase === "transition" ? `🔄 ${transitionLeft}s` :
             phase === "ready"      ? `⏳ ${readyLeft}s`       :
                                      `⏱️ ${timeLeft}s`}
          </div>
        </header>

        <main className="gameMain">

          <section className="scoreRow">
            <div className={`scoreBox ${team === "A" ? "active" : "inactive"}`}>
              <div className="scoreLabel">Equipa A</div>
              <div className="scoreNum">{scoreA}</div>
            </div>
            <div className={`scoreBox ${team === "B" ? "active" : "inactive"}`}>
              <div className="scoreLabel">Equipa B</div>
              <div className="scoreNum">{scoreB}</div>
            </div>
          </section>

          <section className="playerRow">
            <div className="playerPill">
              <span className="playerPillTeam">Equipa {team}</span>
              {player ? (
                <>
                  <span className="playerPillDot">·</span>
                  <span className="playerPillName">🎤 {player}</span>
                </>
              ) : null}
              <span className="playerPillSub">está a explicar</span>
            </div>
            <div className="winRule">até {WIN_SCORE} pts</div>
          </section>

          <section className={`card ${phase === "ready" ? "isReady" : ""}`} style={{position:"relative"}}>

            {perfectFlash && (
              <div className="perfectFlashOverlay">
                <span className="perfectFlashText">🔥 Carta Perfeita!</span>
              </div>
            )}

            <div className="cardTop">
              <div className="cardTitle">Carta</div>
              <div className="cardHint">
                {phase === "transition" ? "Passa o telemóvel…" :
                 phase === "ready"      ? "Pronto…" :
                 paused                 ? "⏸ Contestar pontos" :
                                          "Toca nos itens certos"}
              </div>
            </div>

            {phase === "transition" && !winner ? (
              <div className="cardReadyOverlay" aria-live="polite">
                <div className="transitionLayout">

                  <div className="transBigScore">
                    <div className={`transBigTeam ${team === "B" ? "transWasB" : "transWasA"}`}>
                      <div className="transBigLabel">Equipa A</div>
                      <div className="transBigNum">{scoreA}</div>
                    </div>
                    <div className="transBigVs">vs</div>
                    <div className={`transBigTeam ${team === "A" ? "transWasB" : "transWasA"}`}>
                      <div className="transBigLabel">Equipa B</div>
                      <div className="transBigNum">{scoreB}</div>
                    </div>
                  </div>

                  <div className="transNextPill">
                    <div className="transNextSub">A seguir</div>
                    <div className="transNextTeam">Equipa {team}</div>
                    {player ? <div className="transNextPlayer">🎤 {player}</div> : null}
                  </div>

                </div>
              </div>
            ) : null}

            {phase === "ready" && !winner ? (
              <div className="cardReadyOverlay" aria-live="polite">
                <div className="readyPill">
                  <div className="readyTitle">Pronto…</div>
                  <div className="readyCount">{readyLeft}</div>
                  <div className="readySub">Não espreitem 😉</div>
                </div>
              </div>
            ) : null}

            {phase === "play" && paused && !winner ? (
              <div className="pauseUndoContainer">
                <div className="pauseUndoHeader">
                  <div className="pauseUndoTitle">⏸ Contestar ponto</div>
                  <div className="pauseUndoHint">Toca para remover um ponto incorreto</div>
                </div>
                {checked.some(Boolean)
                  ? card.map((item, i) =>
                      checked[i] ? (
                        <button key={i} className="pauseUndoItem" type="button" onClick={() => undoItem(i)}>
                          <span>✅</span>
                          <span className="pauseUndoItemText">{item}</span>
                          <span className="pauseUndoAction">↩️ remover</span>
                        </button>
                      ) : null
                    )
                  : <div className="pauseUndoEmpty">Nenhum ponto para contestar</div>
                }
              </div>
            ) : null}

            {phase === "play" && !paused ? (
              <div className="itemsList">
                {card.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => onToggleItem(i)}
                    disabled={winner || paused || timeLeft <= 0 || checked[i]}
                    className={[
                      "itemBtn",
                      checked[i]             ? "done"       : "",
                      collapsingItems.has(i) ? "collapsing" : "",
                    ].filter(Boolean).join(" ")}
                    type="button"
                  >
                    <span className="itemNum">{i + 1}</span>
                    <span className="itemText">{item}</span>
                    <span className="itemCheck">
                      <span className="itemCheckCircle">{checked[i] ? "✓" : ""}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}


          </section>

          <footer className="actionDock">
            <button className="btnSoft dockFull dockBig" onClick={swapCard}
              disabled={winner || phase !== "play" || paused || swapsLeft <= 0} type="button">
              🔄 Trocar carta ({swapsLeft}/{SWAPS_PER_ROUND})
            </button>

            {hasAnyNames && (
              <button className="btnSoft dockFull dockBig" onClick={passTurnNow}
                disabled={winner || phase !== "play" || paused || passUsed} type="button">
                ⏭️ Passar jogador{passUsed ? " (usado)" : ""}
              </button>
            )}

            <button className="btnSoft dockFull dockBig" onClick={() => undoItem(history[history.length - 1])}
              disabled={winner || phase !== "play" || history.length === 0} type="button">
              ↩️ Desfazer último ponto
            </button>

            <button className="btnSoft dockFull dockBig" onClick={togglePause}
              disabled={winner} type="button">
              {paused ? "▶️ Continuar" : "⏸️ Pausa"}
            </button>

            <div className="footNoteDock">
              Round muda automaticamente • {READY_SECONDS}s de preparação
            </div>
          </footer>

        </main>
      </div>

      {NamesOverlay}
      {VictoryOverlay}
      {RoundSummaryOverlay}
    </div>
  );
}
