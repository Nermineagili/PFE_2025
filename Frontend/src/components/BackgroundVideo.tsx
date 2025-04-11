
import '../App.css'; // Import the CSS file

const BackgroundVideo = () => {
  return (
    <div className="video-container">
      <video autoPlay loop muted className="background-video">
        <source src="/videos/bgvid.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="content">
        <h1>YOMI Assurance</h1>
        <p>Enjoy a seamless experience!</p>
      </div>
    </div>
  );
};

export default BackgroundVideo;
