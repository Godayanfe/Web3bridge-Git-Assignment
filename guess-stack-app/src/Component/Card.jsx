export default function Card({ svgMarkup }) { 
  return ( 
    <div className="card"> 
      <div dangerouslySetInnerHTML={{ __html: svgMarkup }} /> 
    </div>
  );
}