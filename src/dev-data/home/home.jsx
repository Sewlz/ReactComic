import React, { useState, useEffect } from "react";
import axios from "axios";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css/autoplay";
import "swiper/css";
import "./home.css";
import Latest from "../latest-upload/latest";
import PopularByGernes from "../popular-by-gernes/popbygernes";

function Home() {
  //manga datas
  const [mangaIds, setMangaIds] = useState([]);
  const [mangaTitles, setMangaTitles] = useState([]);
  const [mangaDescriptons, setMangaDescriptions] = useState([]);
  const [mangaAuthor, setMangaAuthor] = useState([]);
  const [coverUrls, setCoverUrls] = useState([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchManga = async () => {
      //get ids and titles
      try {
        const resp = await axios({
          method: "GET",
          params: {
            limit: 10,
            order: {
              followedCount: "desc",
            },
          },
          url: `https://api.mangadex.org/manga`,
        });
        const ids = resp.data.data.map((manga) => manga.id);
        //get titles
        const titles = resp.data.data.map((manga) => {
          const titleObj = manga.attributes.title;
          // Access the first title in the object
          const firstTitleKey = Object.keys(titleObj)[0]; // Get the first language key
          const firstTitle = titleObj[firstTitleKey]; // Get the title associated with that key
          return firstTitle;
        });
        //get descriptions
        const description = resp.data.data.map((manga) => {
          const desObj = manga.attributes.description;
          const firstDesKey = Object.keys(desObj)[0];
          const firstDes = desObj[firstDesKey];
          return firstDes;
        });
        //get author
        const author = await Promise.all(
          resp.data.data.map(async (manga) => {
            const authorRel = manga.relationships.find(
              (rel) => rel.type === "author"
            );
            if (authorRel) {
              const authorResp = await axios.get(
                `https://api.mangadex.org/author/${authorRel.id}`
              );
              const authorName = authorResp.data.data.attributes.name;
              return authorName;
            }
            return null;
          })
        );
        //get cover arts
        const covers = await Promise.all(
          resp.data.data.map(async (manga) => {
            const coverArtRel = manga.relationships.find(
              (rel) => rel.type === "cover_art"
            );
            if (coverArtRel) {
              const coverResp = await axios.get(
                `https://api.mangadex.org/cover/${coverArtRel.id}`
              );
              const coverFileName = coverResp.data.data.attributes.fileName;
              return `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}`;
            }
            return null;
          })
        );
        //set data
        setMangaTitles(titles);
        setMangaIds(ids);
        setMangaDescriptions(description);
        setMangaAuthor(author);
        setCoverUrls(covers.filter(Boolean));
      } catch (error) {
        setError("Error fetching manga.");
        console.error("Error fetching manga:", error);
      }
    };
    fetchManga();
  }, []);
  if (error) {
    return <div>{error}</div>;
  }
  function sendData(index) {
    sessionStorage.setItem("coverUrl", coverUrls[index]);
    sessionStorage.setItem("mangaTitle", mangaTitles[index]);
    sessionStorage.setItem("mangaDescription", mangaDescriptons[index]);
    sessionStorage.setItem("mangaAuthor", mangaAuthor[index]);
  }
  return (
    <>
      <div className="title-wrapper">
        <span>
          <i className="fas fa-star"></i> Popular Titles
        </span>
      </div>

      <div className="popular-wrapper">
        <Swiper
          slidesPerView={1}
          // spaceBetween={30}
          loop={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          modules={[Autoplay]}
          className="mySwiper"
        >
          {coverUrls.map((url, index) => (
            <SwiperSlide key={index} onClick={() => sendData(index)}>
              <a href={`/info?id=${mangaIds[index]}`}>
                <div
                  className="popular-card"
                  style={{
                    backgroundImage: `url(${coverUrls[index]})`,
                    backgroundSize: "cover",
                  }}
                >
                  <img className="popular-img" src={url} alt="" />
                  <div className="popular-info">
                    <h3>{mangaTitles[index]}</h3>
                    <p>{mangaDescriptons[index]}</p>
                  </div>
                </div>
              </a>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <Latest />
      <PopularByGernes />
    </>
  );
}

export default Home;
