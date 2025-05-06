import '../App.css'; // Importation du fichier CSS

const BackgroundVideo = () => {
  return (
    <div className="video-container">
      <video autoPlay loop muted className="background-video">
        <source src="/videos/bgvid.mp4" type="video/mp4" />
        Votre navigateur ne prend pas en charge la balise vidéo.
      </video>
      <div className="content">
        <h1>YOMI Assurance</h1>
        <p>Profitez d'une expérience fluide !</p>
      </div>
    </div>
  );
};

export default BackgroundVideo;
