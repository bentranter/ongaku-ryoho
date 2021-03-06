module Utils exposing (..)

import Css.Helpers exposing (identifierToString)
import Html exposing (Attribute)
import Html.CssHelpers exposing (..)
import Http
import Svg
import Svg.Attributes
import Char
import Hex


-- Css


emptyCssNamespace : Namespace String class id msg
emptyCssNamespace =
    withNamespace ""


cssClasses : List class -> Attribute msg
cssClasses =
    emptyCssNamespace.class


cssClass : class -> Attribute msg
cssClass class =
    cssClasses [ class ]


cssSvgClass : class -> Svg.Attribute msg
cssSvgClass class =
    Svg.Attributes.class (identifierToString "" class)


cssClassList : List ( class, Bool ) -> Attribute msg
cssClassList =
    emptyCssNamespace.classList


cssId : id -> Attribute msg
cssId =
    emptyCssNamespace.id


cssSvgId : id -> Svg.Attribute msg
cssSvgId id =
    Svg.Attributes.id (identifierToString "" id)



-- Other


lowercaseHexadecimalString : String -> String
lowercaseHexadecimalString input =
    input



-- |> String.toLower
-- |> String.toList
-- |> List.map Char.toCode
-- |> List.map Hex.toString
-- |> String.concat


makeQueryParam : ( String, String ) -> String
makeQueryParam ( a, b ) =
    Http.encodeUri a ++ "=" ++ Http.encodeUri b
