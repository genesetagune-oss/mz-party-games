import { BaseEngine } from "./baseEngine.js";

const READY_SECONDS = 3;
const TURN_SECONDS = 90;
const PASSES_PER_TURN = 10;
const WIN_SCORE = 10;

// ✅ Estrutura UNIFORME: { type: "text" | "img", value?: string, src?: string }

function t(value) { return { type: "text", value }; }

// ──── MIX ────
const ITEMS_MIX = [
  "Cristiano Ronaldo","Lionel Messi","Beyoncé","Michael Jackson",
  "Rihanna","Drake","Eminem","The Rock","Neymar","Ronaldinho",
  "Elon Musk","Donald Trump","Barack Obama","Nelson Mandela",
  "Leonardo DiCaprio","Will Smith","Usain Bolt","Mike Tyson",
  "Conor McGregor","Kim Kardashian","Shakira","Justin Bieber",
  "Snoop Dogg","Lady Gaga","Albert Einstein","Marilyn Monroe",
  "Bruce Lee","Arnold Schwarzenegger","Gordon Ramsay","MrBeast",
  "John Cena","Freddie Mercury","Bob Marley","Elvis Presley",
  "Neyma","Mr. Bow","Ziqo","Azagaia","Eusébio","Samora Machel",
  "Graça Machel","Wazimbo","Guyzelh Ramos","Lurdes Mutola",
  "Batman","Spider-Man","Superman","Hulk","Joker","Darth Vader",
  "Harry Potter","Pikachu","Goku","Naruto","Luffy","Shrek",
  "Simba","Elsa","Mickey Mouse","Homer Simpson","SpongeBob",
  "Mario","Sonic","Thanos","Deadpool","Jack Sparrow",
  "Woody","Buzz Lightyear","Baby Yoda","Walter White",
  "Tommy Shelby","Drácula","Frankenstein",
  "Pizza","Coca-Cola","Hambúrguer","Chocolate","Guitarra",
  "Telemóvel","Avião","Ferrari","Netflix","PlayStation",
  "Leão","Tubarão","Elefante","Gorila","T-Rex",
  "Cobra","Águia","Pinguim","Crocodilo","Dragão",
  "Capulana","Chapa","Matapa","Xima","2M",
  "Chamussas","Lobolo","Timbila","Curandeiro","Piri-Piri",
  { type: "img", src: "/whoiswhofotos/Famosos/global/cr7.jpeg" },
  { type: "img", src: "/whoiswhofotos/Famosos/global/batman.jpeg" },
  { type: "img", src: "/whoiswhofotos/Famosos/mz/azagaia.jpeg" },
  { type: "img", src: "/whoiswhofotos/brands/vodacom.png.jpeg" },
].map(x => typeof x === "string" ? t(x) : x);

// ──── MZ TEXTO ────
const ITEMS_MZ = [
  "Wazimbo","Stewart Sukuma","Mingas","Neyma","Lizha James",
  "Marllen","Lourena Nhate","Ziqo","Mr. Bow","MC Roger",
  "Azagaia","Dama do Bling","Valdemiro José","Tamyris Moiane",
  "Hernâni da Silva","Bander","Bangla 10","Mr. Kuka",
  "Kiba the Seven","Laylizzy","Kamane Kamas","Hot Blaze",
  "Twenty Fingers","Doppaz","Percella","Melony","Denilson",
  "Alcy Coluamba","Deborah Duarte","Sheldon","Justino Ubakka",
  "Edmázia Mayembe","Pérola","Stefânia Leonel","Dygo Boy",
  "Shabba Wonder","King Cizzy","Kenny Yuran","Edu All Talents",
  "Edy Puff","Puto Aires","Djimetta","Valentino De La Vega",
  "Feliciano dos Santos","Eyuphuro","Ghorwane","Fany Pfumo",
  "Dilon Djindji","Iveth","Nuno Abdul","Yadah","Cheny",
  "Tio Edson","Gito","Zena Bacar","Jay Argh","Moz Kidd",
  "Samora Machel","Eduardo Mondlane","Joaquim Chissano","Armando Guebuza",
  "Filipe Nyusi","Graça Machel","Venâncio Mondlane","Daniel Chapo",
  "Josina Machel","Afonso Dhlakama","Daviz Simango",
  "Mia Couto","Paulina Chiziane","José Craveirinha","Malangatana",
  "Eusébio","Mário Coluna","Lurdes Mutola","Gungunhana",
  "Salimo Abdula","Mabulu",
  "Tico-Tico","Genito Bila","Dominguês","Chiquinho Conde",
  "Guyzelh Ramos","Maxh 258","Armando e Daniela","Victor Renér",
  "Igor Idelson","Noslen Araújo","Maira Santos",
  "C4 Pedro","Anselmo Ralph","Nelson Freitas","Calema",
  "Matias Damásio","Dji Tafinha","Diamond Platnumz",
  "Harmonize","Fally Ipupa","Koffi Olomide","Innoss'B",
  "Matapa","Xima","Chamussas","Badjias","Pão com Badjia",
  "Galinha à Zambeziana","Frango à Cafreal","Caril de Amendoim",
  "2M","Laurentina","Piri-Piri","Caju",
  "Capulana","Chapa","Txopela","Lobolo","Xitique",
  "Timbila","Mbira","Marrabenta","Metical","Curandeiro",
  "Mamba","Crocodilo","Hipopótamo","Elefante","Leão",
  "Macaco","Camaleão","Tartaruga Marinha","Tubarão-Baleia","Flamingo",
].map(t);

// ──── GLOBAL TEXTO ────
const ITEMS_GLOBAL = [
  "Michael Jackson","Elvis Presley","Madonna","Bob Marley","Freddie Mercury",
  "Beyoncé","Rihanna","Taylor Swift","Drake","Eminem",
  "Jay-Z","Kanye West","Adele","Lady Gaga","Bruno Mars",
  "Justin Bieber","The Weeknd","Ed Sheeran","Billie Eilish","Shakira",
  "Nicki Minaj","Cardi B","Post Malone","Snoop Dogg","50 Cent",
  "Tupac","Notorious B.I.G.","Bob Dylan","Elton John","David Bowie",
  "Amy Winehouse","Britney Spears","Chris Brown","Dua Lipa","Bad Bunny",
  "Ariana Grande","Kendrick Lamar","Travis Scott","Daddy Yankee",
  "Cristiano Ronaldo","Lionel Messi","Neymar","Kylian Mbappé",
  "Pelé","Maradona","Ronaldinho","David Beckham","Zinedine Zidane",
  "Michael Jordan","LeBron James","Kobe Bryant","Stephen Curry",
  "Usain Bolt","Muhammad Ali","Mike Tyson","Floyd Mayweather",
  "Conor McGregor","Serena Williams","Tiger Woods",
  "Lewis Hamilton","Ayrton Senna","Roger Federer","Rafael Nadal",
  "Simone Biles","The Rock","John Cena",
  "Leonardo DiCaprio","Tom Hanks","Brad Pitt","Will Smith",
  "Dwayne Johnson","Ryan Reynolds","Keanu Reeves","Tom Cruise",
  "Robert Downey Jr.","Johnny Depp","Morgan Freeman","Denzel Washington",
  "Angelina Jolie","Scarlett Johansson","Margot Robbie","Zendaya",
  "Jennifer Lawrence","Emma Watson","Gal Gadot",
  "Jim Carrey","Kevin Hart","Adam Sandler","Robin Williams","Eddie Murphy",
  "Arnold Schwarzenegger","Sylvester Stallone","Jackie Chan","Bruce Lee",
  "Marilyn Monroe","Audrey Hepburn","Charles Chaplin",
  "Kim Kardashian","Kylie Jenner","MrBeast","PewDiePie",
  "Oprah Winfrey","Joe Rogan","Gordon Ramsay","KSI",
  "Logan Paul","IShowSpeed","Kai Cenat","Khaby Lame",
  "Nelson Mandela","Barack Obama","Martin Luther King Jr.","Donald Trump",
  "Vladimir Putin","Rainha Elizabeth II","Princesa Diana","Papa Francisco",
  "Mahatma Gandhi","Abraham Lincoln","Winston Churchill",
  "Napoleão Bonaparte","Cleópatra","Júlio César","Alexandre o Grande",
  "Adolf Hitler","Albert Einstein","Nikola Tesla","Stephen Hawking",
  "Leonardo da Vinci","Marie Curie","Charles Darwin",
  "Elon Musk","Jeff Bezos","Bill Gates","Steve Jobs","Mark Zuckerberg",
  "Malala Yousafzai","Greta Thunberg","Anne Frank",
  "Batman","Superman","Spider-Man","Hulk","Thor",
  "Capitão América","Homem de Ferro","Deadpool","Wolverine",
  "Thanos","Joker","Darth Vader","Harley Quinn","Venom","Loki",
  "Harry Potter","Hermione Granger","Voldemort","Dumbledore",
  "Gandalf","Frodo","Sherlock Holmes","Robin Hood",
  "Mickey Mouse","Simba","Elsa","Woody","Buzz Lightyear",
  "Nemo","Shrek","Gru","Stitch","Moana","Rapunzel",
  "Pikachu","Mario","Luigi","Sonic","Pac-Man",
  "Homer Simpson","Bart Simpson","SpongeBob","Bugs Bunny","Scooby-Doo",
  "Peter Griffin","Rick Sanchez","Baby Yoda",
  "Goku","Naruto","Luffy",
  "Walter White","Jon Snow","Daenerys Targaryen","Tommy Shelby",
  "Jack Sparrow","Hannibal Lecter",
  "Drácula","Frankenstein","Peter Pan","Pinóquio",
  "Pizza","Hambúrguer","Sushi","Chocolate","Coca-Cola",
  "Gelado","Café","Cerveja","Taco","Croissant",
  "Guitarra","Piano","Bateria","Microfone",
  "Telemóvel","Televisão","Computador","Câmara",
  "Bicicleta","Carro","Avião","Foguetão","Helicóptero",
  "Guarda-chuva","Óculos de Sol","Relógio","Mochila",
  "Espada","Escudo","Coroa","Troféu",
  "Preservativo","Fralda","Escova de Dentes",
  "Leão","Elefante","Tubarão","Golfinho","Gorila",
  "Cobra","Águia","Urso","Lobo","Tigre",
  "Pinguim","Girafa","Crocodilo","Panda","Canguru",
  "Polvo","Baleia","Koala","Tartaruga","Papagaio",
  "T-Rex","Unicórnio","Dragão",
  "Nike","Ferrari","McDonald's","Apple","Google",
  "Netflix","PlayStation","Bitcoin","Barbie","LEGO",
].map(t);

// ──── MZ FOTOS ────
const ITEMS_MZ_PIC = [
  "/whoiswhofotos/brands/2m.png.jpeg",
  "/whoiswhofotos/brands/bci.png.jpeg",
  "/whoiswhofotos/brands/millennium-bim.png.jpeg",
  "/whoiswhofotos/brands/movitel.png.jpeg",
  "/whoiswhofotos/brands/moza-bank.png.jpeg",
  "/whoiswhofotos/brands/namaacha.png.jpeg",
  "/whoiswhofotos/brands/standard-bank.png.jpeg",
  "/whoiswhofotos/brands/stv.png.jpeg",
  "/whoiswhofotos/brands/tmcel.png.jpeg",
  "/whoiswhofotos/brands/tvm.png.jpeg",
  "/whoiswhofotos/brands/txilar.png.jpeg",
  "/whoiswhofotos/brands/vodacom.png.jpeg",
  "/whoiswhofotos/brands/yango.png.jpeg",
  "/whoiswhofotos/Famosos/mz/azagaia.jpeg",
  "/whoiswhofotos/Famosos/mz/guyzelh.jpeg",
  "/whoiswhofotos/Famosos/mz/samora.jpeg",
  "/whoiswhofotos/Famosos/mz/stuart.jpeg",
  "/whoiswhofotos/lugares/baia.jpeg",
  "/whoiswhofotos/lugares/maputo.jpeg",
  "/whoiswhofotos/lugares/mares.jpeg",
  "/whoiswhofotos/object/ball.jpeg",
  "/whoiswhofotos/object/bandeira.jpeg",
  "/whoiswhofotos/object/geleira.jpeg",
  "/whoiswhofotos/object/plastico.jpeg",
  "/whoiswhofotos/object/tv.jpeg",
].map(src => ({ type: "img", src }));

// ──── GLOBAL FOTOS ────
const ITEMS_GLOBAL_PIC = [
  "/whoiswhofotos/Famosos/global/batman.jpeg",
  "/whoiswhofotos/Famosos/global/cr7.jpeg",
  "/whoiswhofotos/Famosos/global/ironman.jpeg",
  "/whoiswhofotos/Famosos/global/messi.jpeg",
  "/whoiswhofotos/Famosos/global/mj.jpeg",
  "/whoiswhofotos/Famosos/global/neymar.jpeg",
  "/whoiswhofotos/Famosos/global/spiderman.jpeg",
  "/whoiswhofotos/Famosos/global/superman.jpeg",
].map(src => ({ type: "img", src }));

// ──── FILMES & SÉRIES ────
const ITEMS_FILMES = [
  "Titanic","Avatar","Star Wars","Matrix","Jurassic Park",
  "O Padrinho","Forrest Gump","Pulp Fiction","Fight Club","Scarface",
  "Inception","Interestelar","Duna","Oppenheimer","Barbie",
  "Gladiador","300","Rocky","Rambo","Terminator",
  "John Wick","Kill Bill","Django Livre","The Revenant",
  "O Lobo de Wall Street","Shawshank Redemption","O Iluminado",
  "Joker","Top Gun","Die Hard","Mad Max","Alien",
  "E.T.","Tubarão","O Exorcista","It","Pânico",
  "Get Out","Parasita","Bohemian Rhapsody","La La Land","8 Mile",
  "A Procura da Felicidade","O Náufrago","Men in Black",
  "Rei Leão","Frozen","Toy Story","Nemo","Coco",
  "Encanto","Moana","Shrek","Minions","Ratatouille",
  "Up","Inside Out","A Era do Gelo","Kung Fu Panda","Madagascar",
  "Aladdin","A Pequena Sereia","Branca de Neve","Cinderela","Mulan",
  "A Bela e a Fera","Lilo & Stitch","Os Incríveis","Spider-Verse",
  "101 Dálmatas","Tarzan","Peter Pan",
  "Vingadores: Endgame","Homem-Aranha","Batman","Superman",
  "Pantera Negra","Homem de Ferro","Capitão América","Thor",
  "Deadpool","Mulher-Maravilha","Aquaman","X-Men",
  "Guardiões da Galáxia","Doutor Estranho","Venom","Flash",
  "Game of Thrones","Breaking Bad","Stranger Things","La Casa de Papel",
  "Narcos","Peaky Blinders","The Walking Dead","Prison Break",
  "Vikings","Squid Game","The Crown","Succession",
  "The Last of Us","House of the Dragon","Ozark","Dexter",
  "Lost","The Boys","Lupin","Cobra Kai","Wednesday",
  "The Witcher","Arcane","Grey's Anatomy","Suits",
  "Dark","Euphoria","Sex Education","Teen Wolf",
  "Power","Snowfall","Yellowstone","Sherlock",
  "Friends","The Office","How I Met Your Mother","The Big Bang Theory",
  "Brooklyn Nine-Nine","Modern Family","Seinfeld",
  "Family Guy","South Park","Rick and Morty","Os Simpsons",
  "American Dad","Futurama","Bob Esponja",
  "Hannah Montana","High School Musical","Camp Rock",
  "Phineas e Ferb","Kim Possible","Violetta","Soy Luna",
  "iCarly","Drake & Josh","Victorious","Henry Danger",
  "Os Padrinhos Mágicos","Avatar: A Lenda de Aang","Danny Phantom",
  "Ben 10","As Meninas Super Poderosas","Johnny Bravo",
  "Coragem o Cão Covarde","Hora de Aventura","O Incrível Mundo de Gumball",
  "Steven Universe","Teen Titans Go!","Regular Show","Chowder",
  "Os Jovens Titãs","Dexter's Laboratory","Oggy e as Baratas",
  "Doraemon","Shin Chan","Beyblade","Bakugan",
  "Power Rangers","Miraculous Ladybug","Winx Club",
  "Totally Spies","Gravity Falls",
  "Avenida Brasil","A Escrava Isaura","O Clone","Rebelde","Malhação","Pantanal",
].map(t);

// ──── MÚSICA ────
const ITEMS_MUSICA = [
  "Michael Jackson","Madonna","Beyoncé","Rihanna","Taylor Swift",
  "Lady Gaga","Adele","Ed Sheeran","Bruno Mars","Justin Bieber",
  "The Weeknd","Billie Eilish","Dua Lipa","Harry Styles","Ariana Grande",
  "Miley Cyrus","Selena Gomez","Katy Perry","Sia","Shakira",
  "Demi Lovato","Camila Cabello","Olivia Rodrigo","Doja Cat","SZA",
  "Lizzo","Halsey","Lana Del Rey",
  "Eminem","Jay-Z","Kanye West","Drake","Kendrick Lamar",
  "Tupac","Notorious B.I.G.","Snoop Dogg","Dr. Dre","50 Cent",
  "Lil Wayne","Nicki Minaj","Cardi B","Travis Scott","Post Malone",
  "Lil Nas X","J. Cole","Tyler, the Creator","Ice Cube",
  "Wiz Khalifa","Young Thug","Future","21 Savage","Migos",
  "XXXTENTACION","Juice WRLD","Pop Smoke","Childish Gambino",
  "Elvis Presley","The Beatles","Queen","Freddie Mercury",
  "The Rolling Stones","Led Zeppelin","Pink Floyd","AC/DC",
  "Nirvana","Guns N' Roses","Metallica","Linkin Park",
  "Coldplay","U2","Foo Fighters","Red Hot Chili Peppers",
  "Maroon 5","Imagine Dragons","Oasis","Green Day",
  "Bon Jovi","Aerosmith","ABBA","Bee Gees",
  "Whitney Houston","Aretha Franklin","Stevie Wonder","Prince",
  "Chris Brown","Usher","Alicia Keys","John Legend","Frank Sinatra",
  "Tina Turner","Sam Smith","Khalid","PARTYNEXTDOOR",
  "Bryson Tiller","Summer Walker","Brent Faiyaz","Ty Dolla $ign",
  "Bad Bunny","Daddy Yankee","J Balvin","Maluma","Ozuna",
  "Karol G","Anitta","Rosalía","Pitbull","Marc Anthony",
  "Burna Boy","Wizkid","Davido","Tems","Fela Kuti",
  "Cesária Évora","Miriam Makeba","Diamond Platnumz",
  "David Guetta","Marshmello","Avicii","Tiësto","Skrillex",
  "Calvin Harris","Daft Punk",
  "BTS","BLACKPINK",
  "Bob Marley","Elton John","David Bowie","Jimi Hendrix",
  "Amy Winehouse","Britney Spears","Jennifer Lopez","Christina Aguilera",
  "Backstreet Boys","Spice Girls","One Direction",
  "Bob Dylan","Ray Charles","James Brown","Marvin Gaye",
  "Phil Collins","George Michael","Seal","Sade",
  "Anitta","Ivete Sangalo","Marília Mendonça","Ludmilla",
  "Gusttavo Lima","Alexandre Pires","Thiaguinho",
  "MC Kevinho","MC Daniel","Pedro Sampaio",
  "Neyma","Lizha James","Mr. Bow","Ziqo","MC Roger",
  "Azagaia","Wazimbo","Stewart Sukuma","Mingas",
].map(t);

// ──── DESPORTO ────
const ITEMS_DESPORTO = [
  "Cristiano Ronaldo","Lionel Messi","Kylian Mbappé","Erling Haaland",
  "Vinícius Júnior","Neymar","Mohamed Salah","Jude Bellingham",
  "Kevin De Bruyne","Robert Lewandowski","Lamine Yamal",
  "Bukayo Saka","Rodri","Cole Palmer","Phil Foden",
  "Harry Kane","Bruno Fernandes","Bernardo Silva",
  "Pelé","Maradona","Zinedine Zidane","Ronaldinho","Ronaldo Fenómeno",
  "David Beckham","Thierry Henry","Zlatan Ibrahimović","Kaká","Roberto Carlos",
  "Didier Drogba","Samuel Eto'o","Andrea Pirlo","Sergio Ramos",
  "Wayne Rooney","Steven Gerrard","Johan Cruyff","Franz Beckenbauer",
  "George Weah","Jay-Jay Okocha","Sadio Mané","N'Golo Kanté",
  "Eusébio","Mário Coluna","Lurdes Mutola","Tico-Tico","Genito Bila",
  "Michael Jordan","LeBron James","Kobe Bryant","Stephen Curry",
  "Shaquille O'Neal","Kevin Durant","Giannis Antetokounmpo",
  "Magic Johnson","Allen Iverson","Luka Dončić",
  "Roger Federer","Rafael Nadal","Novak Djokovic","Serena Williams",
  "Carlos Alcaraz","Naomi Osaka",
  "Usain Bolt","Carl Lewis","Jesse Owens","Mo Farah","Simone Biles",
  "Muhammad Ali","Mike Tyson","Floyd Mayweather","Manny Pacquiao",
  "Canelo Álvarez","Anthony Joshua","Tyson Fury",
  "Conor McGregor","Jon Jones","Israel Adesanya","Alex Pereira",
  "Khabib Nurmagomedov","Amanda Nunes","Anderson Silva","Ronda Rousey",
  "Lewis Hamilton","Max Verstappen","Ayrton Senna","Michael Schumacher",
  "Charles Leclerc","Lando Norris",
  "The Rock","John Cena","The Undertaker","Rey Mysterio",
  "Roman Reigns","Brock Lesnar","Stone Cold Steve Austin",
  "Hulk Hogan","Randy Orton","Triple H","Seth Rollins",
  "Edge","Goldberg","Batista","Kane","Big Show",
  "Real Madrid","Barcelona","Manchester United","Liverpool","Chelsea",
  "PSG","Bayern Munich","Juventus","AC Milan","Benfica",
  "Porto","Sporting","Ajax","Borussia Dortmund","Inter Milan",
  "Tiger Woods","Tom Brady","Tony Hawk","Michael Phelps",
  "Wayne Gretzky","Valentino Rossi",
].map(t);

// ──── ANIME ────
const ITEMS_ANIME = [
  "Goku","Vegeta","Gohan","Piccolo","Frieza","Cell","Buu",
  "Naruto","Sasuke","Kakashi","Sakura","Itachi","Madara","Hinata",
  "Luffy","Zoro","Sanji","Nami","Ace","Shanks","Whitebeard","Robin",
  "Ichigo","Rukia","Byakuya","Aizen",
  "Eren Jaeger","Mikasa","Levi","Armin",
  "Tanjiro","Nezuko","Zenitsu","Inosuke",
  "Deku","Bakugo","Todoroki","All Might",
  "Gojo Satoru","Yuji Itadori","Sukuna",
  "Light Yagami","L","Ryuk",
  "Edward Elric","Alphonse Elric",
  "Killua","Gon","Hisoka",
  "Saitama","Genos",
  "Kirito","Asuna",
  "Lelouch","Spike Spiegel",
  "Pikachu","Ash Ketchum","Charizard",
  "Sailor Moon",
  "Dragon Ball Z","Dragon Ball Super","One Piece",
  "Naruto Shippuden","Boruto","Bleach",
  "Attack on Titan","Demon Slayer","Jujutsu Kaisen",
  "My Hero Academia","Death Note","Fullmetal Alchemist",
  "Hunter x Hunter","One Punch Man","Sword Art Online",
  "Tokyo Ghoul","Fairy Tail","Black Clover",
  "Haikyuu","Mob Psycho 100",
  "Cavaleiros do Zodíaco","Yu-Gi-Oh!","Inuyasha",
  "Samurai X","Super Strikers","Inazuma Eleven",
  "Cowboy Bebop","Neon Genesis Evangelion","Akira",
  "Spirited Away","Princess Mononoke","My Neighbor Totoro",
  "Howl's Moving Castle","Beyblade","Bakugan",
].map(t);

// ──── BÍBLIA ────
const ITEMS_BIBLIA = [
  "Adão","Eva","Noé","Abraão","Sara","Isaque","Jacó","José",
  "Moisés","Aarão","Josué","Sansão","Dalila","Rute","Boaz",
  "Samuel","Saul","Davi","Golias","Salomão","Elias","Eliseu",
  "Jonas","Daniel","Ester","Neemias","Isaías","Jeremias",
  "Ezequiel","Débora","Gideão","Jefté","Abigail","Bate-Seba",
  "Rebeca","Raquel","Lea","Rúben","Benjamim",
  "Jesus","Maria","José (pai de Jesus)","Pedro","Paulo",
  "João","Lucas","Marcos","Mateus","Judas","André","Tiago",
  "Filipe","Bartolomeu","Marta","Maria Madalena","Lázaro","Zaqueu",
  "Nicodemos","Herodes","Pilatos","João Batista","Elisabete",
  "Zacarias","Cornélio","Estêvão","Barnabé","Silas","Timóteo",
  "Tito","Áquila","Priscila","Salomé",
  "Génesis","Êxodo","Deuteronómio","Salmos","Provérbios",
  "Apocalipse","Cantares","Eclesiastes","Levítico","Números",
  "Juízes","Reis","Crónicas","Job","Lamentações",
  "Actos","Romanos","Coríntios","Gálatas","Efésios",
  "Filipenses","Hebreus","Tiago",
].map(t);

// ──── FAMÍLIA ────
const ITEMS_FAMILIA = [
  "Leão","Elefante","Girafa","Zebra","Macaco","Golfinho","Baleia",
  "Tubarão","Crocodilo","Tartaruga","Borboleta","Abelha","Cão","Gato",
  "Coelho","Pinguim","Urso","Panda","Canguru","Koala","Polvo","Flamingo",
  "Papagaio","Coruja","Cavalo","Vaca","Porco","Galinha","Pato","Ovelha",
  "Cobra","Sapo","Caracol","Formiga","Aranha","Lagarto",
  "Sol","Lua","Arco-Íris","Chuva","Trovão","Neve",
  "Montanha","Rio","Mar","Floresta","Vulcão","Estrela",
  "Casa","Escola","Pizza","Gelado","Bolo","Hambúrguer",
  "Maçã","Banana","Morango","Chocolate","Pipoca",
  "Avião","Carro","Bicicleta","Barco","Foguetão","Helicóptero",
  "Castelo","Espada","Coroa","Guitarra","Tambor",
  "Bola","Skate","Balão","Presente","Vela",
  "Relógio","Guarda-chuva","Lanterna","Mochila",
  "Mickey Mouse","Minnie Mouse","Pato Donald","Simba","Mufasa",
  "Elsa","Anna","Olaf","Woody","Buzz Lightyear",
  "Nemo","Dory","Wall-E","Shrek","Gato de Botas",
  "Fiona","Moana","Rapunzel","Cinderela","Branca de Neve",
  "Ariel","Bela","Mulan","Dumbo","Bambi",
  "Stitch","Gru","Minions","Ratatouille","Lightning McQueen",
  "Tom e Jerry","Peppa Pig","Bob Esponja","Patrick Estrela",
  "Scooby-Doo","Pica-Pau","Bugs Bunny","Pernalonga",
  "Dora a Exploradora","Bluey","Patrulha Pata","Pocoyo",
  "Ben 10","Pikachu","Sonic","Mario","Luigi",
  "Bart Simpson","Homer Simpson","Peter Pan","Sininho",
  "Princesa Sofia","Miraculous Ladybug",
  "As Meninas Super Poderosas","Johnny Bravo","Dexter",
  "Spider-Man","Batman","Superman","Hulk","Thor",
  "Capitão América","Homem de Ferro","Wonder Woman",
  "Médico","Bombeiro","Polícia","Professor","Astronauta",
  "Piloto","Palhaço","Pirata","Cozinheiro","Dentista",
  "Ninja","Princesa","Rei","Rainha","Fada",
  "Pizza","Gelado","Chocolate","Bolo","Hambúrguer",
  "Banana","Maçã","Morango","Pipoca","Donut",
  "Bluey", "Chase (PAW Patrol)", "Dora a Exploradora",
].map(t);

// ──── MEMES ────
const ITEMS_MEMES = [
  "Distracted Boyfriend", "Drake Meme", "Doge", "Pepe the Frog", "This Is Fine",
  "Surprised Pikachu", "Woman Yelling at Cat", "Two Buttons", "Stonks", "Gru's Plan",
  "Galaxy Brain", "Baby Yoda", "Among Us", "Gigachad", "Trollface",
  "Forever Alone", "Wojak", "Hide the Pain Harold", "Shrek", "Rick Roll",
  "Skibidi Toilet", "NPC", "Sigma male", "Slay", "Ohio meme", "Ratio",
  "SpongeBob Mocking", "Patrick Star", "John Cena", "Shaggy Ultra Instinct",
  "One Does Not Simply", "Grumpy Cat", "Success Kid", "Bad Luck Brian",
  "Harambe", "Salt Bae", "Arthur's Fist", "Big Chungus",
  "Return to Monke", "Vibe Check", "OK Boomer", "Bussin", "No Cap",
  "Rizz", "Mannequin Challenge", "Harlem Shake", "Gangnam Style",
  "Ice Bucket Challenge", "Nyan Cat", "Dramatic Chipmunk", "Double Rainbow",
  "Leeroy Jenkins", "Charlie bit my finger", "It's giving", "Delulu",
  "Ate and left no crumbs", "Crying Jordan", "Confused Travolta",
  "That's fire", "Hits different", "Lowkey", "Touch Grass",
  "Bernie mittens", "GigaChad walk", "Ight Imma Head Out",
].map(t);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeCategory(cat) {
  const c = String(cat || "").trim().toLowerCase();
  const MAP = {
    mz: "mz", mzpic: "mzPic", mzpictures: "mzPic",
    global: "global", globalpic: "globalPic",
    filmes: "filmes", movies: "filmes",
    musica: "musica", music: "musica",
    desporto: "desporto", sport: "desporto",
    anime: "anime",
    biblia: "biblia", bible: "biblia",
    familia: "familia", family: "familia",
    memes: "memes",
  };
  return MAP[c] || "mix";
}

export class WhoIsWhoEngine extends BaseEngine {
  constructor({ io, roomCode, room }) {
    super({ io, roomCode, room });

    const initialCategory = normalizeCategory(room?.settings?.category || "mix");

    this.state = {
      phase: "lobby",
      turnPhase: "ready",
      round: 0,
      winnerTeam: null,
      currentTeam: null,
      currentPlayerId: null,
      endsAt: null,
      paused: false,
      pausedRemainingMs: 0,
      category: initialCategory,
      deck: shuffle(this.getDeck(initialCategory)),
      deckIndex: 0,
      item: null,
      scores: { A: 0, B: 0 },
      passLeft: PASSES_PER_TURN,
      lastExplainerIdByTeam: { A: null, B: null },
    };
  }

  players() { return [...this.room.players.values()]; }
  playersByTeam(team) { return this.players().filter(p => (p.team || "A") === team); }
  otherTeam(team) { return team === "A" ? "B" : "A"; }
  currentPlayer() {
    if (!this.state.currentPlayerId) return null;
    return this.room.players.get(this.state.currentPlayerId) || null;
  }

  getDeck(categoryKey) {
    const k = normalizeCategory(categoryKey);
    if (k === "mz")        return ITEMS_MZ;
    if (k === "mzPic")     return ITEMS_MZ_PIC;
    if (k === "global")    return ITEMS_GLOBAL;
    if (k === "globalPic") return ITEMS_GLOBAL_PIC;
    if (k === "filmes")    return ITEMS_FILMES;
    if (k === "musica")    return ITEMS_MUSICA;
    if (k === "desporto")  return ITEMS_DESPORTO;
    if (k === "anime")     return ITEMS_ANIME;
    if (k === "biblia")    return ITEMS_BIBLIA;
    if (k === "familia")   return ITEMS_FAMILIA;
    if (k === "memes")     return ITEMS_MEMES;
    return ITEMS_MIX;
  }

  resetDeck(categoryKey) {
    const cat = normalizeCategory(categoryKey);
    this.state.category = cat;
    if (!this.room.settings) this.room.settings = {};
    this.room.settings.category = cat;
    this.state.deck = shuffle(this.getDeck(cat));
    this.state.deckIndex = 0;
    this.state.item = null;
  }

  ensureDeck() {
    if (!this.state.deck || this.state.deck.length === 0) {
      this.state.deck = shuffle(this.getDeck(this.state.category));
      this.state.deckIndex = 0;
    }
  }

  nextItem() {
    this.ensureDeck();
    const deck = this.state.deck;
    const idx = this.state.deckIndex % deck.length;
    this.state.item = deck[idx] || null;
    this.state.deckIndex = (this.state.deckIndex + 1) % deck.length;
    this.emitEvent({ type: "ITEM_CHANGED", by: this.state.currentPlayerId, team: this.state.currentTeam });
  }

  pickRandomStartingTeam() {
    const hasA = this.playersByTeam("A").length > 0;
    const hasB = this.playersByTeam("B").length > 0;
    if (hasA && hasB) return Math.random() < 0.5 ? "A" : "B";
    if (hasA) return "A";
    if (hasB) return "B";
    return null;
  }

  pickNextExplainer(team) {
    const list = this.playersByTeam(team);
    if (!list.length) return null;
    const last = this.state.lastExplainerIdByTeam?.[team] || null;
    if (!last) {
      this.state.lastExplainerIdByTeam[team] = list[0].id;
      return list[0];
    }
    const idx = list.findIndex(p => p.id === last);
    const next = list[(idx >= 0 ? idx + 1 : 0) % list.length];
    this.state.lastExplainerIdByTeam[team] = next.id;
    return next;
  }

  startPlayTimers(remainingMs) {
    const ms = Math.max(0, remainingMs);
    this.state.turnPhase = "play";
    this.state.paused = false;
    this.state.pausedRemainingMs = 0;
    this.state.endsAt = Date.now() + ms;
    this.emitEvent({ type: "TURN_STARTED", team: this.state.currentTeam, by: this.state.currentPlayerId });
    this._setInterval(() => this.emitState(), 300);
    this._setTimeout(() => this.endTurn("TIME_UP"), ms);
    this.emitState();
  }

  pauseTurn(socketId) {
    const cur = this.currentPlayer();
    if (!cur) return;
    if (socketId !== cur.id) return this.emitError(socketId, "NOT_YOUR_TURN");
    if (this.state.phase !== "playing") return this.emitError(socketId, "GAME_NOT_PLAYING");
    if (this.state.turnPhase !== "play") return this.emitError(socketId, "NOT_IN_PLAY_PHASE");
    if (this.state.paused) return;
    const remaining = this.state.endsAt ? Math.max(0, this.state.endsAt - Date.now()) : 0;
    this.clearTimers();
    this.state.paused = true;
    this.state.pausedRemainingMs = remaining;
    this.state.endsAt = null;
    this.emitEvent({ type: "PAUSED", by: socketId, remainingMs: remaining });
    this.emitState();
  }

  resumeTurn(socketId) {
    const cur = this.currentPlayer();
    if (!cur) return;
    if (socketId !== cur.id) return this.emitError(socketId, "NOT_YOUR_TURN");
    if (this.state.phase !== "playing") return this.emitError(socketId, "GAME_NOT_PLAYING");
    if (this.state.turnPhase !== "play") return this.emitError(socketId, "NOT_IN_PLAY_PHASE");
    if (!this.state.paused) return;
    const remaining = Math.max(0, this.state.pausedRemainingMs || 0);
    this.state.paused = false;
    this.state.pausedRemainingMs = 0;
    this.emitEvent({ type: "RESUMED", by: socketId, remainingMs: remaining });
    this.clearTimers();
    this.state.endsAt = Date.now() + remaining;
    this._setInterval(() => this.emitState(), 300);
    this._setTimeout(() => this.endTurn("TIME_UP"), remaining);
    this.emitState();
  }

  setCategory(socketId, category) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase !== "lobby") return this.emitError(socketId, "NOT_IN_LOBBY");
    const cat = normalizeCategory(category);
    this.resetDeck(cat);
    this.emitEvent({ type: "CATEGORY_SET", by: socketId, category: cat });
    this.emitState();
  }

  startGame(socketId) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase !== "lobby") return this.emitError(socketId, "GAME_ALREADY_STARTED");
    if (this.players().length < 2) return this.emitError(socketId, "NOT_ENOUGH_PLAYERS");
    const startTeam = this.pickRandomStartingTeam();
    if (!startTeam) return this.emitError(socketId, "NO_TEAMS");
    const cat = normalizeCategory(this.room?.settings?.category || this.state.category || "mix");
    this.resetDeck(cat);
    this.state.phase = "playing";
    this.state.turnPhase = "ready";
    this.state.round = 1;
    this.state.winnerTeam = null;
    this.state.scores = { A: 0, B: 0 };
    this.state.currentTeam = startTeam;
    this.state.passLeft = PASSES_PER_TURN;
    this.state.lastExplainerIdByTeam = { A: null, B: null };
    this.emitEvent({ type: "GAME_STARTED", by: socketId, startingTeam: startTeam, category: cat });
    this.startTurn();
  }

  startTurn() {
    if (this.state.phase !== "playing") return;
    this.clearTimers();
    this.state.paused = false;
    this.state.pausedRemainingMs = 0;
    this.state.passLeft = PASSES_PER_TURN;
    let explainer = this.pickNextExplainer(this.state.currentTeam);
    if (!explainer) {
      const other = this.otherTeam(this.state.currentTeam);
      explainer = this.pickNextExplainer(other);
      if (!explainer) {
        this.state.phase = "lobby"; this.state.turnPhase = "ready";
        this.state.currentTeam = null; this.state.currentPlayerId = null;
        this.state.item = null; this.state.endsAt = null;
        this.emitState(); return;
      }
      this.state.currentTeam = other;
    }
    this.state.currentPlayerId = explainer.id;
    this.nextItem();
    this.state.turnPhase = "ready";
    this.state.endsAt = Date.now() + READY_SECONDS * 1000;
    this.emitEvent({ type: "TURN_READY", team: this.state.currentTeam, by: this.state.currentPlayerId });
    this._setInterval(() => this.emitState(), 250);
    this.emitState();
    this._setTimeout(() => {
      if (this.state.phase !== "playing") return;
      this.clearTimers();
      this.startPlayTimers(TURN_SECONDS * 1000);
    }, READY_SECONDS * 1000);
  }

  endTurn(reason) {
    if (this.state.phase !== "playing") return;
    this.clearTimers();
    this.state.paused = false;
    this.state.pausedRemainingMs = 0;
    this.emitEvent({ type: "TURN_ENDED", reason, team: this.state.currentTeam, by: this.state.currentPlayerId });
    if (this.state.currentTeam) this.state.currentTeam = this.otherTeam(this.state.currentTeam);
    this.state.round = (this.state.round || 0) + 1;
    if (this.players().length >= 2) {
      this.startTurn();
    } else {
      this.state.phase = "lobby"; this.state.turnPhase = "ready";
      this.state.currentTeam = null; this.state.currentPlayerId = null;
      this.state.item = null; this.state.endsAt = null;
      this.emitState();
    }
  }

  restartGame(socketId) {
    const p = this.room.players.get(socketId);
    if (!p) return this.emitError(socketId, "PLAYER_NOT_IN_ROOM");
    if (!p.isHost) return this.emitError(socketId, "HOST_ONLY");
    if (this.state.phase !== "finished") return this.emitError(socketId, "NOT_FINISHED");
    this.clearTimers();
    const cat = normalizeCategory(this.room?.settings?.category || this.state.category || "mix");
    this.state.phase = "lobby"; this.state.turnPhase = "ready"; this.state.round = 0;
    this.state.winnerTeam = null; this.state.currentTeam = null; this.state.currentPlayerId = null;
    this.state.endsAt = null; this.state.paused = false; this.state.pausedRemainingMs = 0;
    this.state.scores = { A: 0, B: 0 }; this.state.passLeft = PASSES_PER_TURN;
    this.state.lastExplainerIdByTeam = { A: null, B: null };
    this.resetDeck(cat);
    this.emitEvent({ type: "GAME_RESTARTED", by: socketId, category: cat });
    this.emitState();
  }

  handleCommand(socketId, command) {
    const cur = this.currentPlayer();
    if (!cur) return;
    if (socketId !== cur.id) return this.emitError(socketId, "NOT_YOUR_TURN");
    if (this.state.phase !== "playing") return this.emitError(socketId, "GAME_NOT_PLAYING");
    const type = command?.type;

    if (type === "PAUSE_TOGGLE") {
      if (this.state.turnPhase !== "play") return this.emitError(socketId, "NOT_IN_PLAY_PHASE");
      if (this.state.paused) this.resumeTurn(socketId);
      else this.pauseTurn(socketId);
      return;
    }

    if (this.state.paused) return this.emitError(socketId, "PAUSED");
    if (this.state.turnPhase !== "play") return this.emitError(socketId, "NOT_IN_PLAY_PHASE");

    if (type === "YES") {
      const team = this.state.currentTeam || cur.team || "A";
      this.state.scores[team] = (this.state.scores[team] || 0) + 1;
      this.emitEvent({ type: "YES", by: socketId, team, score: this.state.scores[team] });
      if (this.state.scores[team] >= WIN_SCORE) {
        this.state.winnerTeam = team;
        this.state.phase = "finished"; this.state.turnPhase = "ready";
        this.state.endsAt = null; this.state.paused = false; this.state.pausedRemainingMs = 0;
        this.clearTimers();
        this.emitEvent({ type: "GAME_FINISHED", winnerTeam: team });
        this.emitState(); return;
      }
      this.nextItem(); this.emitState(); return;
    }

    if (type === "NO") {
      this.emitEvent({ type: "NO", by: socketId, team: this.state.currentTeam });
      this.nextItem(); this.emitState(); return;
    }

    if (type === "CLOSE") {
      // Quase — sem ponto, avança item, emite feedback visual
      this.emitEvent({ type: "CLOSE", by: socketId, team: this.state.currentTeam });
      this.nextItem(); this.emitState(); return;
    }

    if (type === "PASS") {
      if ((this.state.passLeft || 0) <= 0) return this.emitError(socketId, "NO_PASSES_LEFT");
      this.state.passLeft -= 1;
      this.emitEvent({ type: "PASS", by: socketId, left: this.state.passLeft, team: this.state.currentTeam });
      this.nextItem(); this.emitState(); return;
    }

    return this.emitError(socketId, "UNKNOWN_COMMAND");
  }

  getPublicState() {
    const cur = this.currentPlayer();
    let remainingMs = 0;
    if (this.state.paused) remainingMs = Math.max(0, this.state.pausedRemainingMs || 0);
    else remainingMs = this.state.endsAt ? Math.max(0, this.state.endsAt - Date.now()) : 0;
    return {
      gameType: "whoIsWho",
      phase: this.state.phase,
      turnPhase: this.state.turnPhase,
      round: this.state.round,
      winnerTeam: this.state.winnerTeam,
      category: this.state.category,
      currentTeam: this.state.currentTeam,
      currentPlayer: cur ? { id: cur.id, name: cur.name, team: cur.team } : null,
      paused: this.state.paused,
      remainingMs,
      scores: this.state.scores,
      passLeft: this.state.passLeft,
      item: this.state.item
        ? { type: this.state.item.type, id: `${this.state.deckIndex}-${this.state.item.type}` }
        : null,
    };
  }

  getPrivateState(playerId) {
    const me = this.room.players.get(playerId);
    const cur = this.currentPlayer();
    if (!me || !cur) return { canAct: false, role: "NONE", item: null };
    const isExplainer = playerId === cur.id;
    return {
      role: isExplainer ? "EXPLAINER" : "GUESSER",
      canAct: isExplainer && this.state.phase === "playing" && this.state.turnPhase === "play" && !this.state.paused,
      team: me.team ?? null,
      item: isExplainer ? this.state.item : null,
    };
  }

  onPlayerLeave(player) {
    const cur = this.currentPlayer();
    if (this.state.phase === "playing" && cur && player?.id === cur.id) {
      this.endTurn("EXPLAINER_LEFT"); return;
    }
    this.emitState();
  }
}
